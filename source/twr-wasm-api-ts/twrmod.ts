// class twrWasmModule
// This class provides functions for loading a Web Assembly Module, and calling C code
//
// loadWasm() - loads a compiled wasm file (that is assumed to be linked with the twr wasm runtime library)
//            - options direct where stdout is directed.   The defaults are HTML div "twr_iodiv", then canvas "twr_iocanvas", then debug
//            - is you plan to use stdin, you must use twrWasmAsyncModule
// executeC() - execute a C function exported by the loaded Module.  Handle's numbers, string, files, and Uint8Array as parameters.
// various utility functions
//
// for blocking C functions, see class twrWasmModuleAsync

import {debugLog} from "./twrdiv.js"
import {IModOpts} from "./twrmodbase.js";
import {twrWasmModuleInJSMain} from "./twrmodjsmain.js"


export class twrWasmModule extends twrWasmModuleInJSMain {
	 memory:WebAssembly.Memory;
	 mem8:Uint8Array;
	 malloc:(size:number)=>Promise<number>;


	constructor(opts:IModOpts={}) {
		super(opts);
		this.memory=new WebAssembly.Memory({initial: 10, maximum:100, shared:true});
        this.mem8 = new Uint8Array(this.memory.buffer);
		this.malloc=(size:number)=>{throw new Error("error - un-init malloc called")};

		this.modParams.imports={
			twrDebugLog:debugLog,
			twrDivCharOut:this.iodiv.charOut.bind(this.iodiv),
			twrCanvasGetProp:this.iocanvas.getProp.bind(this.iocanvas),
			twrCanvasDrawSeq:this.iocanvas.drawSeq.bind(this.iocanvas),
			twrCanvasCharIn:this.null,
			twrCanvasInkey:this.null,
			twrDivCharIn:this.null,
		}
	}

	null() {
		console.log("warning - call to unimplemented twrXXX import in twrWasmModule");
	}
}




