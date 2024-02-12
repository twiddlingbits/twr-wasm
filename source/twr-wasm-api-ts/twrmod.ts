// class twrWasmModule
// This class provides functions for loading a Web Assembly Module, and calling C code
//
// loadWasm() - loads a compiled wasm file (that is assumed to be linked with the twr wasm runtime library)
//            - options direct where stdout is directed.   The defaults are HTML div "twr_iodiv", then canvas "twr_iocanvas", then debug
//            - is you plan to use stdin, you must use twrWasmAsyncModule
// executeC() - execute a C function exported by the loaded Module.  Handle's numbers, string, files, and Uint8Array as parameters.
// various utility functions
//
// for blocking C functions, see class twrWasmAsyncModule

import {twrDiv, debugLog} from "./twrdiv.js"
import {twrCanvas} from "./twrcanvas.js"

//export interface twrFileName {
//	twrFileName:string;
//}

//export function twrIsFileName(x: any): x is twrFileName {
//	return (x as twrFileName).twrFileName !== undefined;
 // }


export type TstdioVals="div"|"canvas"|"null"|"debug";

export interface ItwrModOpts {
	stdio?:TstdioVals, 
	windim?:[number, number],
	memory?:WebAssembly.Memory // used by twrWasmModule when instantiated from twrWasmAsyncModule worker thread
}

export class twrWasmModuleBase {
	canvas:twrCanvas;
	winWidth=0;
	winHeight=0;
	div:twrDiv;
	isWorker:boolean;
	opts:ItwrModOpts;
	mem8:Uint8Array;
	memory:WebAssembly.Memory;
	malloc:(size:number)=>Promise<number>;

   constructor(memory:WebAssembly.Memory, opts:ItwrModOpts={}) {
	   let de,ce;
	   this.isWorker=typeof document === 'undefined';
	   if (!this.isWorker) {
		   de=document.getElementById("twr_iodiv") as HTMLDivElement;
		   ce=document.getElementById("twr_iocanvas") as HTMLCanvasElement;

		   if (opts.stdio=='div' && !de) throw new Error("twrWasmModuleBase opts=='div' but twr_iodiv not defined");
		   if (opts.stdio=='canvas' && !ce) throw new Error("twrWasmModuleBase, opts=='canvas' but twr_iocanvas not defined");
	   }

	   this.div=new twrDiv(de);
	   this.canvas=new twrCanvas(ce);

	   // set default opts based on elements found
	   if (this.div.isvalid()) opts={stdio:"div", ...opts};
	   else if (this.canvas.isvalid()) opts={stdio:"canvas",  ...opts};
	   else opts={stdio:"debug", ...opts};

	   if (opts.stdio=='canvas') opts={windim:[64, 16], ...opts};
	   else opts={windim:[0, 0], ...opts};

	   this.opts=opts;
	   this.winWidth=opts.windim![0];
	   this.winHeight=opts.windim![1];

	   // set wasm module memory

	   this.memory=memory;
	   this.mem8 = new Uint8Array(memory.buffer);

	   this.malloc=(size:number)=>{
			return new Promise(resolve => {
				console.log("error - dummy malloc called");
				resolve(0);
			});
	   };
	}

	null() {
		return 0;
	}

	// allocate and copy a string into the webassembly module memory
	async stringToMem(sin:string) {
		let strIndex:number=await this.malloc(sin.length);
		let i;
		for (i=0; i<sin.length; i++)
			this.mem8[strIndex+i]=sin.charCodeAt(i);

		this.mem8[strIndex+i]=0;

		return strIndex;
	}

	async uint8ArrayToMem(src:Uint8Array) {
		let dest:number=await this.malloc(src.length+1); // +1 is hack that basic requires, on my to fix list
		let i;
		for (i=0; i<src.length; i++)
			this.mem8[dest+i]=src[i];

		return dest;
	}

	// given a url, load its contents, and stuff into wasm memory similar to Unint8Array
	async urlToMem(fnin:URL) {

		if (!(typeof fnin === 'object' && fnin instanceof URL))
			throw new Error("urlToMem param must be URL");

		try {
			let response=await fetch(fnin);
			let buffer = await response.arrayBuffer();
			let src = new Uint8Array(buffer);
			let dest=await this.uint8ArrayToMem(src);
			this.mem8[dest+src.length]=0;   // hack that basic requires.  
			return [dest, src.length+1];
			
		} catch(err:any) {
			console.log('urlToMem Error: ' + err + (err.stack ? "\n" + err.stack : ''));
			throw err;
		}
	}

	// get a string out of module memory
	memToString(strIndex:number): string {
		let sout="";

		let i=0;
		while (this.mem8[strIndex+i] && (strIndex+i) < this.mem8.length) {
			sout=sout+String.fromCharCode(this.mem8[strIndex+i]);
			i++;
		}

		return sout;
	}

	// get a byte array out of module memory when passed in index to [size, dataptr]
	memToUint8Array(idx:number): Uint8Array {
		if (idx<0 || idx>= this.mem8.length) throw new Error("invalid index passed to memToUint8Array");

		const rv = new Uint32Array( (this.mem8.slice(idx, idx+8)).buffer );
		let size:number=rv[0];
		let dataptr:number=rv[1];

		if (dataptr <0 || dataptr >= (this.mem8.length)) throw new Error("invalid idx.dataptr passed to memToUint8Array")
		if (size <0 || size > (this.mem8.length-dataptr)) throw new Error("invalid idx.size passed to  memToUint8Array")

		const u8=this.mem8.slice(dataptr, dataptr+size);
		return u8;
	}

	// get a int32 array out of module memory when passed in index to [size, dataptr]
	memToUint32Array(idx:number): Uint32Array {
		if (idx<0 || idx>= this.mem8.length) throw new Error("invalid index passed to memToUint8Array");

		const rv = new Uint32Array( (this.mem8.slice(idx, idx+8)).buffer );
		let size:number=rv[0];
		let dataptr:number=rv[1];

		if (dataptr <0 || dataptr >= (this.mem8.length)) throw new Error("invalid idx.dataptr passed to memToUint8Array")
		if (size <0 || size > (this.mem8.length-dataptr)) throw new Error("invalid idx.size passed to  memToUint8Array")

		if (size%4!=0) throw new Error("idx.size is not an integer number of 32 bit words");

		const u32 = new Uint32Array( (this.mem8.slice(dataptr, dataptr+size)).buffer );
		return u32;
	}

	// convert an array of parameters to numbers by stuffing contents into wasm
	async convertParams(params:[string, ...(string|number|Uint8Array|URL)[]]) {

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
					cparams[ci++]=await this.stringToMem(p);
					break;
				case 'object':
					if (p instanceof URL) {
						const r=await this.urlToMem(p);
						cparams[ci++]=r[0];  // mem index
						cparams[ci++]=r[1];   // len
						break;
					}
					else if (p instanceof Uint8Array) {
						const r=await this.uint8ArrayToMem(p);
						cparams[ci++]=r;  // mem index
						cparams[ci++]=p.length;   // len
						break;
					}
				default:
					throw new Error ("executeC: invalid object type passed in");
			}
		}

		return cparams;
	}
}

//************************************************************
//************************************************************
//************************************************************

export class twrWasmModule extends twrWasmModuleBase {
	 exports:WebAssembly.Exports|undefined;


	constructor(opts:ItwrModOpts={}) {
		const {memory=new WebAssembly.Memory({initial: 10, maximum:100, shared:true})}=opts;
		super(memory, opts);
	}

	async loadWasm(urToLoad:URL, imports={}) {
		try {
			let response=await fetch(urToLoad);
			if (!response.ok) throw new Error(response.statusText);
			let wasmBytes = await response.arrayBuffer();

			let allimports:WebAssembly.ModuleImports = { 
				memory: this.memory,
				twrDebugLog:debugLog,
				twrDivCharOut:this.div.charOut.bind(this.div),
				twrCanvasGetAvgCharWidth:this.canvas.getAvgCharWidth.bind(this.canvas),
				twrCanvasGetCharHeight:this.canvas.getCharHeight.bind(this.canvas),
				twrCanvasGetColorWhite:this.canvas.getColorWhite.bind(this.canvas),
				twrCanvasGetColorBlack:this.canvas.getColorBlack.bind(this.canvas),
				twrCanvasFillRect:this.canvas.fillRect.bind(this.canvas),
				twrCanvasCharOut:this.canvas.charOut.bind(this.canvas),
				twrCanvasCharIn:this.null,
				twrCanvasInkey:this.null,
				twrDivCharIn:this.null,
				...imports
			};

			let instance = await WebAssembly.instantiate(wasmBytes, {env: allimports});

			this.exports=instance.instance.exports;

			this.malloc=(size:number)=>{
				return new Promise(resolve => {
					const m=this.exports!.twr_malloc as (size:number)=>number;
					resolve(m(size));
				});
		   };

			this.twrInit();

		} catch(err:any) {
			console.log('WASM instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
			throw err;
		}
	}

	private twrInit() {
			let p:number;
			switch (this.opts.stdio) {
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

			const init=this.exports!.twr_wasm_init as CallableFunction;
			init(p, this.winWidth, this.winHeight);
	}

	/*********************************************************************/
	/*********************************************************************/
	/*********************************************************************/

	/* executeC takes an array where:
	* the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
	* and the next entries are a variable number of parameters to pass to the C function, of type
	* number - converted to int32 or float64 as appropriate
	* string - converted to a an index (ptr) into a module Memory returned via stringToMem()
	* URL - the file contents are loaded into module Memory via urlToMem(), and two C parameters are generated - index (pointer) to the memory, and length
	* Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length
    */

	async executeC(params:[string, ...(string|number|Uint8Array|URL)[]]) {
		const cparams=await this.convertParams(params);
		return this.executeCImpl(params[0], cparams);
	}

	async executeCImpl(fname:string, cparams:number[]=[]) {
		if (!this.exports) throw new Error("this.exports undefined");
		if (!this.exports[fname]) throw new Error("executeC: function '"+fname+"' not in export table");

		const f = this.exports[fname] as CallableFunction;
		let cr=f(...cparams);

		return cr;
	}

}



