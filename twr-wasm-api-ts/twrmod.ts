// class twrWasmModule
// This class provides functions for loading a Web Assembly Module, and calling C code
//
// loadWasm() - loads a compiled wasm file (that is assumed to be linked with the twr wasm runtime library)
//            - options direct where stdout and the debugcon are directed.   The defaults are HTML div "twr_stdout" and the web debug console.
//            - as of this writing, you need to use twrWasmAsyncModule for stdin.
// executeC() - execute a C function exported by the loaded Module.  Handle's numbers, string, files, and Uint8Array as parameters.
// various utility functions
//
// for blocking C functions, see class twrWasmAsyncModule

import {twrDiv, debugLog} from "./twrdiv.js"
import { twrCanvas } from "./twrcanvas.js"

export interface twrFileName {
	twrFileName:string;
}

export function twrIsFileName(x: any): x is twrFileName {
	return (x as twrFileName).twrFileName !== undefined;
  }


export type TstdioVals="div"|"canvas"|"null"|"debug";

export interface IloadWasmOpts {
	stdio?:TstdioVals, 
	imports?:{}
}

function nullin() {
	return 0;
}

export class twrWasmModule {
	 exports:WebAssembly.Exports|undefined;
	 mem8:Uint8Array|undefined;
	 canvas:twrCanvas;
	 div:twrDiv;

	constructor() {
		let de,ce;
		if (!(typeof document === 'undefined')) {
			de=document.getElementById("twr_iodiv") as HTMLDivElement;
			ce=document.getElementById("twr_iocanvas") as HTMLCanvasElement;
		}
		this.div=new twrDiv(de);
		this.canvas=new twrCanvas(ce);
	}

	async loadWasm(urToLoad:string|URL, opts:IloadWasmOpts={}) {

		//console.log("loadwasm: ",urToLoad, opts)
		
		// validate opts possible
		if (opts.stdio=='div' && !this.div.isvalid()) throw new Error("loadWasm, opts=='div' but twr_iodiv not defined");
		if (opts.stdio=='canvas' && !this.canvas.isvalid()) throw new Error("loadWasm, opts=='canvas' but twr_iocanvas not defined");

		// set default opts based on elements found
		if (this.div.isvalid()) opts={stdio:"div", ...opts};
		else if (this.canvas.isvalid()) opts={stdio:"canvas", ...opts};
		else opts={stdio:"debug", ...opts};

		const {  // obj deconstruct syntax
			stdio,
			imports={},
		}=opts;

		try {
			let response=await fetch(urToLoad);
			if (!response.ok) throw new Error(response.statusText);
			let wasmBytes = await response.arrayBuffer();
			const memory=new WebAssembly.Memory({initial: 10, maximum:100 })
			this.mem8 = new Uint8Array(memory.buffer);
			let allimports:WebAssembly.ModuleImports = { 
				memory: memory,
				twrDebugLog:debugLog,
				twrDivCharOut:this.div.charOut.bind(this.div),
				twrCanvasGetAvgCharWidth:this.canvas.getAvgCharWidth.bind(this.canvas),
				twrCanvasGetCharHeight:this.canvas.getCharHeight.bind(this.canvas),
				twrCanvasGetColorWhite:this.canvas.getColorWhite.bind(this.canvas),
				twrCanvasGetColorBlack:this.canvas.getColorBlack.bind(this.canvas),
				twrCanvasFillRect:this.canvas.fillRect.bind(this.canvas),
				twrCanvasCharOut:this.canvas.charOut.bind(this.canvas),
				twrCanvasCharIn:nullin,
				twrCanvasInkey:nullin,
				twrDivCharIn:nullin,
				...imports
			};

			let instance = await WebAssembly.instantiate(wasmBytes, {env: allimports});

			this.exports=instance.instance.exports;

			this.twrInit(stdio!);

		} catch(err:any) {
			console.log('WASM instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
			throw err;
		}
	}

	private twrInit(stdio:TstdioVals) {
			let p:number;
			switch (stdio) {
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
			init(p);
	}

	/*********************************************************************/
	/*********************************************************************/
	/*********************************************************************/

	/* executeC takes an array where:
	* the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
	* and the next entries are a variable numnber of parameters to pass to the C function, of type
	* number - cnverted to int32 or float64 as appropriate
	* string - converted to a an index (ptr) into a module Memory returend via stringToMem()
	* twrFileName - the file contents are loaded into module Memory via fileToMem(), and two C paramters are generated - index (pointer) to the memory, and length
	* Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length
    */

	async executeC(params:[string, ...(string|number|Uint8Array|twrFileName)[]]) {
		if (!(params.constructor === Array)) throw new Error ("executeC: params must be array, first arg is function name");
		if (params.length==0) throw new Error("executeC: missing function name");
		if (!this.exports) throw new Error("this.exports undefined");
		if (!this.exports[params[0]]) throw new Error("executeC: function '"+params[0]+"' not in export table");
		let cparams:number[]=[];
		let ci=0;
		for (let i=1; i < params.length; i++) {
			const p=params[i];
			switch (typeof p) {
				case 'number':
					cparams[ci++]=p;
					break;
				case 'string':
					cparams[ci++]=this.stringToMem(p);
					break;
				case 'object':
					if (twrIsFileName(p)) {
						const r=await this.fileToMem(p);
						cparams[ci++]=r[0];  // mem index
						cparams[ci++]=r[1];   // len
						break;
					}
					else if (p instanceof Uint8Array) {
						const r=this.uint8ArrayToMem(p);
						cparams[ci++]=r;  // mem index
						cparams[ci++]=p.length;   // len
						break;
					}
					default:
						throw new Error ("executeC: invalid object type passed in");
			}
		}

		// now call the C function
		const f = this.exports[params[0]] as CallableFunction;
		let cr=f(...cparams);

		return cr;
	}

	/*********************************************************************/
	/*********************************************************************/
	/*********************************************************************/

	/* utility functions */

	// allocate and copy a string into the webassembly module memory
	stringToMem(sin:string) {
		let malloc = this.exports!.twr_wasm_malloc as CallableFunction;
		let strIndex:number=malloc(sin.length);

		let i;
		for (i=0; i<sin.length; i++)
			this.mem8![strIndex+i]=sin.charCodeAt(i);

		this.mem8![strIndex+i]=0;

		return strIndex;
	}

	uint8ArrayToMem(src:Uint8Array) {
		let malloc = this.exports!.twr_wasm_malloc as CallableFunction;
		let dest:number=malloc(src.length+1);
		let i;
		for (i=0; i<src.length; i++)
			this.mem8![dest+i]=src[i];

		return dest;
	}

	async fileToMem(fnin:string|twrFileName) {
		let filename;
		if (typeof fnin === 'string')
			filename=fnin;
		else if (typeof fnin === 'object' && twrIsFileName(fnin))
			filename=fnin.twrFileName;
		else
			throw new Error("fileToMem param must be string or twrFileName")

		try {
			let response=await fetch(filename);
			let buffer = await response.arrayBuffer();
			let src = new Uint8Array(buffer);
			let dest=this.uint8ArrayToMem(src);
			this.mem8![dest+src.length]=0;   // hack that basic requires.  
			return [dest, src.length+1];
			
		} catch(err:any) {
			console.log('fileToMem Error: ' + err + (err.stack ? "\n" + err.stack : ''));
			throw err;
		}
	}

	// get a string out of module memory
	memToString(strIndex:number): string {
		let sout="";

		let i=0;
		while (this.mem8![strIndex+i] && (strIndex+i) < this.mem8!.length)
			sout=sout+String.fromCharCode(this.mem8![strIndex+i]);

		return sout;
	}
}



