
import {TCanvasProxyParams} from "./twrcanvas.js"
import {TDivProxyParams} from "./twrdiv.js";
import {TWaitingCallsProxyParams} from "./twrwaitingcalls.js"
import {twrDebugLogImpl} from "./twrdebug.js";
import {twrFloatUtil} from "./twrfloat.js";


export type TStdioVals="div"|"canvas"|"null"|"debug";

export interface IModOpts {
	stdio?:TStdioVals, 
	windim?:[number, number],
	forecolor?:string,
	backcolor?:string,
	fontsize?:number,
	isd2dcanvas?:boolean,
	imports?:{},
}

export interface IModParams {
	stdio:TStdioVals, 
	windim:[number, number],
	forecolor:string,
	backcolor:string,
	fontsize:number,
	styleIsDefault: boolean
	isd2dcanvas:boolean,
	imports:{[index:string]:Function},
}

export interface IModInWorkerParams {
	divProxyParams:TDivProxyParams,
	canvasProxyParams:TCanvasProxyParams,
	waitingCallsProxyParams:TWaitingCallsProxyParams,
}

/*********************************************************************/
/*********************************************************************/
/*********************************************************************/

export abstract class twrWasmModuleBase {
	memory?:WebAssembly.Memory;
	mem8:Uint8Array;
	mem32:Uint32Array;
	memD:Float64Array;
	abstract malloc:(size:number)=>Promise<number>;
	abstract modParams:IModParams;
	exports?:WebAssembly.Exports;
	isWorker=false;
	isWasmModule=false;  // twrWasmModule?  (eg. could be twrWasmModuleAsync, twrWasmModuleInWorker, twrWasmModuleInJSMain)
	floatUtil:twrFloatUtil;

	constructor() {
		this.mem8=new Uint8Array();  // avoid type errors
		this.mem32=new Uint32Array();  // avoid type errors
		this.memD=new Float64Array();  // avoid type errors
		this.floatUtil=new twrFloatUtil(this);
		//console.log("size of mem8 after constructor",this.mem8.length);
	}

	/*********************************************************************/
	/*********************************************************************/

	async loadWasm(pathToLoad:string) {
		//console.log("fileToLoad",fileToLoad)

		let response;
		try {
			response=await fetch(pathToLoad);
		} catch(err:any) {
			console.log('loadWasm() failed to fetch: '+pathToLoad);
			throw err;
		}
		
		if (!response.ok) throw new Error("fetch response error on file '"+pathToLoad+"'\n"+response.statusText);

		try {
			let wasmBytes = await response.arrayBuffer();

			let allimports:WebAssembly.ModuleImports = { 
				...this.modParams.imports
			};

			let instance = await WebAssembly.instantiate(wasmBytes, {env: allimports});

			this.exports=instance.instance.exports;
			if (!this.exports) throw new Error("Unexpected error - undefined instance.exports");

			if (this.memory) throw new Error ("unexpected error -- this.memory already set");
			this.memory=this.exports.memory as WebAssembly.Memory;
			if (!this.memory) throw new Error("Unexpected error - undefined exports.memory");
			this.mem8 = new Uint8Array(this.memory.buffer);
			this.mem32 = new Uint32Array(this.memory.buffer);
			this.memD = new Float64Array(this.memory.buffer);
			//console.log("size of mem8 after creation",this.mem8.length);
			if (this.isWorker) {
				if (!(this.memory.buffer instanceof SharedArrayBuffer))
					console.log("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)");
				
				postMessage(["setmemory",this.memory]);
			}
			if (this.isWasmModule) {
				// here if twrWasmModule, twrWasmModuleAsync overrides this function
				if (this.memory.buffer instanceof SharedArrayBuffer)
					console.log("twrWasmModule does not require shared Memory. Remove wasm-ld --shared-memory --no-check-features");
			}

			this.malloc=(size:number)=>{
				return new Promise(resolve => {
					const m=this.exports!.twr_malloc as (size:number)=>number;
					resolve(m(size));
				});
		   };

			this.init();

		} catch(err:any) {
			console.log('WASM instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
			throw err;
		}
	}

	private init() {
		//console.log("loadWasm.init() enter")
			let p:number;
			switch (this.modParams.stdio) {
				case "debug":
					p=0;
					break;
				case "div":
					p=1;
					break;
				case "canvas":
					p=2;
					break;
				case "null":
					p=3;
					break;
				default:
					p=0;  // debug
			}

			const twrInit=this.exports!.twr_wasm_init as CallableFunction;
			//console.log("twrInit:",twrInit)
			twrInit(p, this.mem8.length);
	}

	/* executeC takes an array where:
	* the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
	* and the next entries are a variable number of parameters to pass to the C function, of type
	* number - converted to int32 or float64 as appropriate
	* string - converted to a an index (ptr) into a module Memory returned via stringToMem()
	* URL - the file contents are loaded into module Memory via urlToMem(), and two C parameters are generated - index (pointer) to the memory, and length
	* Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length
    */

	async executeC(params:[string, ...(string|number|ArrayBuffer|URL)[]]) {
		const cparams=await this.preCallC(params);
		let retval = this.executeCImpl(params[0], cparams);
		this.postCallC(cparams, params);
		return retval;
	}

	async executeCImpl(fname:string, cparams:number[]=[]) {
		if (!this.exports) throw new Error("this.exports undefined");
		if (!this.exports[fname]) throw new Error("executeC: function '"+fname+"' not in export table.  Use --export wasm-ld flag.");

		const f = this.exports[fname] as CallableFunction;
		let cr=f(...cparams);

		return cr;
	}

	// convert an array of parameters to numbers by stuffing contents into malloc'd wasm memory
	async preCallC(params:[string, ...(string|number|ArrayBuffer|URL)[]]) {

		if (!(params.constructor === Array)) throw new Error ("executeC: params must be array, first arg is function name");
		if (params.length==0) throw new Error("executeC: missing function name");

		let cparams:number[]=[];
		let ci=0;
		for (let i=1; i < params.length; i++) {
			const p=params[i];
			switch (typeof p) {
				case 'number':
					cparams[ci++]=p;
					break;
				case 'string':
					cparams[ci++]=await this.putString(p);
					break;
				case 'object':
					if (p instanceof URL) {
						const r=await this.fetchAndPutURL(p);
						cparams[ci++]=r[0];  // mem index
						cparams[ci++]=r[1];   // len
						break;
					}
					else if (p instanceof ArrayBuffer) {
						const r=await this.putArrayBuffer(p);
						cparams[ci++]=r;  // mem index
						break;
					}
				default:
					throw new Error ("executeC: invalid object type passed in");
			}
		}

		return cparams;
	}

	// free the mallocs; copy array buffer data from malloc back to arraybuffer
	async postCallC(cparams:number[], params:[string, ...(string|number|ArrayBuffer|URL)[]]) {

		let ci=0;
		for (let i=1; i < params.length; i++) {
			const p=params[i];
			switch (typeof p) {
				case 'number':
					ci++;
					break;

				case 'string':
					this.executeCImpl('twr_free',[cparams[ci]])
					ci++;
					break;
					
				case 'object':
					if (p instanceof URL) {
						this.executeCImpl('twr_free',[cparams[ci]])
						ci=ci+2;
						break;
					}
					else if (p instanceof ArrayBuffer) {
						let u8=new Uint8Array(p);
						for (let j=0; j<u8.length; j++)
							u8[j]=this.mem8[cparams[ci]+j];   // mod.mem8 is a Uint8Array view of the module's Web Assembly Memory
						this.executeCImpl('twr_free',[cparams[ci]])
						ci++;
						break;
					}
					else 
						throw new Error ("postCallC: internal error A");

				default:
					throw new Error ("postCallC: internal error B");
			}
		}

		return cparams;
	}

	/*********************************************************************/
	/*********************************************************************/

	// copy a string into existing buffer in the webassembly module memory
	copyString(buffer:number, buffer_size:number, sin:string):void {
		let i;
		for (i=0; i<sin.length && i<buffer_size-1; i++)
			this.mem8[buffer+i]=sin.charCodeAt(i);

		this.mem8[buffer+i]=0;
	}

	// allocate and copy a string into the webassembly module memory
	async putString(sin:string) {
		let strIndex:number=await this.malloc(sin.length);
		this.copyString(strIndex, sin.length, sin);
		return strIndex;
	}

	async putU8(u8a:Uint8Array) {
		let dest:number=await this.malloc(u8a.length); 
		for (let i=0; i<u8a.length; i++)
			this.mem8[dest+i]=u8a[i];

		return dest;
	}

	async putArrayBuffer(ab:ArrayBuffer) {
		const u8=new Uint8Array(ab);
		return this.putU8(u8);
	}

	// given a url, load its contents, and stuff into wasm memory similar to Unint8Array
	async fetchAndPutURL(fnin:URL) {

		if (!(typeof fnin === 'object' && fnin instanceof URL))
			throw new Error("fetchAndPutURL param must be URL");

		try {
			let response=await fetch(fnin);
			let buffer = await response.arrayBuffer();
			let src = new Uint8Array(buffer);
			let dest=await this.putU8(src);
			return [dest, src.length];
			
		} catch(err:any) {
			console.log('fetchAndPutURL Error. URL: '+fnin+'\n' + err + (err.stack ? "\n" + err.stack : ''));
			throw err;
		}
	}

	getLong(idx:number): number {
		const idx32=Math.floor(idx/4);
		if (idx32*4!=idx) throw new Error("getLong passed non long aligned address")
		if (idx32<0 || idx32 >= this.mem32.length) throw new Error("invalid index passed to getLong: "+idx+", this.mem32.length: "+this.mem32.length);
		const long:number = this.mem32[idx32];
		return long;
	}
	
	setLong(idx:number, value:number) {
        const idx32 = Math.floor(idx / 4);
        if (idx32 * 4 != idx)
            throw new Error("setLong passed non long aligned address");
        if (idx32 < 0 || idx32 >= this.mem32.length)
            throw new Error("invalid index passed to setLong: " + idx + ", this.mem32.length: " + this.mem32.length);
        this.mem32[idx32]=value;
    }

	getDouble(idx:number): number {
		const idx64=Math.floor(idx/8);
		if (idx64*8!=idx) throw new Error("getLong passed non Float64 aligned address")
		const long:number = this.memD[idx64];
		return long;
	}

	setDouble(idx:number, value:number) {
		const idx64=Math.floor(idx/8);
		if (idx64*8!=idx) throw new Error("setDouble passed non Float64 aligned address")
		this.memD[idx64]=value;
	}

	getShort(idx:number): number {
		if (idx<0 || idx>= this.mem8.length) throw new Error("invalid index passed to getShort: "+idx);
		const short:number = this.mem8[idx]+this.mem8[idx+1]*256;
		return short;
	}

	// get a string out of module memory
	// null terminated, up until max of (optional) len
	getString(strIndex:number, len?:number): string {
		let sout="";

		let i=0;
		while (this.mem8[strIndex+i] && (len===undefined?true:i<len) && (strIndex+i) < this.mem8.length) {
			sout=sout+String.fromCharCode(this.mem8[strIndex+i]);
			i++;
		}

		return sout;
	}

	// get a byte array out of module memory when passed in index to [size, dataptr]
	getU8Arr(idx:number): Uint8Array {
		if (idx<0 || idx>= this.mem8.length) throw new Error("invalid index passed to getU8: "+idx);

		const rv = new Uint32Array( (this.mem8.slice(idx, idx+8)).buffer );
		let size:number=rv[0];
		let dataptr:number=rv[1];

		if (dataptr <0 || dataptr >= (this.mem8.length)) throw new Error("invalid idx.dataptr passed to getU8")
		if (size <0 || size > (this.mem8.length-dataptr)) throw new Error("invalid idx.size passed to  getU8")

		const u8=this.mem8.slice(dataptr, dataptr+size);
		return u8;
	}

	// get a int32 array out of module memory when passed in index to [size, dataptr]
	getU32Arr(idx:number): Uint32Array {
		if (idx<0 || idx>= this.mem8.length) throw new Error("invalid index passed to getU32: "+idx);

		const rv = new Uint32Array( (this.mem8.slice(idx, idx+8)).buffer );
		let size:number=rv[0];
		let dataptr:number=rv[1];

		if (dataptr <0 || dataptr >= (this.mem8.length)) throw new Error("invalid idx.dataptr passed to getU32")
		if (size <0 || size > (this.mem8.length-dataptr)) throw new Error("invalid idx.size passed to  getU32")

		if (size%4!=0) throw new Error("idx.size is not an integer number of 32 bit words");

		const u32 = new Uint32Array( (this.mem8.slice(dataptr, dataptr+size)).buffer );
		return u32;
	}
}
