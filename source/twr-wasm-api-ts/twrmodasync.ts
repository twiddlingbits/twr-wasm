//
// This module provides an asynchronous version of the twrWasmModule's primary functions:
//   - async LoadWasm(...) - load a wasm module
//   - async executeC(...) - execute a C function exported from the module
//
// This class proxies through  WebWorker thread, where the wasm module is loaded and C functions are also executed.
// This allows you to execute C functions that block for long periods of time, while allowing the Main Javascript thread to not block.
// This allows you to execute C functions that use a single main loop, as opposed to an event driven architecture.
// If the C function waits for input (via stdin), it will put the WebWorker thread to sleep, conserving CPU cycles.

import {twrWasmModuleBase, IModOpts, IModParams, IModInWorkerParams} from "./twrmodbase.js";
import {debugLog} from "./twrdiv.js";
import {twrSharedCircularBuffer} from "./twrcircular.js";
import {TCanvasProxyParams} from "./twrcanvas.js";
import {twrWasmModuleInJSMain} from "./twrmodjsmain.js"

import whatkey from "whatkey";

export type TAsyncModStartupMsg = {
	urlToLoad: URL,
	modWorkerParams: IModInWorkerParams,
	modParams: IModParams 
};
		
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
	myWorker:Worker;
	memory:WebAssembly.Memory;
	mem8:Uint8Array;
	malloc:(size:number)=>Promise<number>;
	loadWasmResolve?: (value: void) => void;
	loadWasmReject?: (reason?: any) => void;
	executeCResolve?: (value: unknown) => void;
	executeCReject?: (reason?: any) => void;
	init=false;


	constructor(opts:IModOpts) {
		super(opts);

		this.memory = new WebAssembly.Memory({initial: 10, maximum:100, shared:true });
		this.mem8 = new Uint8Array(this.memory.buffer);

		this.malloc=(size:number)=>{throw new Error("error - un-init malloc called")};

		if (!window.Worker) throw new Error("this browser doesn't support web workers.");
		this.myWorker = new Worker(new URL('twrworker.js', import.meta.url), {type: "module" });
		this.myWorker.onmessage= this.processMsg.bind(this);
	}

	async loadWasm(urToLoad:URL) {
		if (this.init) 	throw new Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");
		this.init=true;

		this.malloc = (size:number) => {
			return this.executeCImpl("twr_malloc", [size]) as Promise<number>;
		}

		return new Promise<void>((resolve, reject)=>{
			this.loadWasmResolve=resolve;
			this.loadWasmReject=reject;

			const modWorkerParams={memory: this.memory, divProxyParams: this.iodiv.getDivProxyParams(), canvasProxyParams: this.iocanvas.getCanvasProxyParams()};

			const startMsg:TAsyncModStartupMsg={ urlToLoad: urToLoad, modWorkerParams: modWorkerParams, modParams: this.modParams};

			this.myWorker.postMessage(['startup', startMsg]);
		});
	}

	async executeC(params:[string, ...(string|number|Uint8Array)[]]) {
		const cparams=await this.convertParams(params); // will also validate params[0]
		return this.executeCImpl(params[0], cparams);
	}	

	async executeCImpl(fname:string, cparams:number[]=[]) {
		return new Promise((resolve, reject)=>{
			this.executeCResolve=resolve;
			this.executeCReject=reject;
			this.myWorker.postMessage(['executeC', fname, cparams]);
		});
	}
	
	// this function should be called from HTML "keypress" event from <div>
	keyDownDiv(ev:KeyboardEvent) {
		if (!this.iodiv || !this.iodiv.divKeys) throw new Error("unexpected undefined twrWasmAsyncModule.divKeys");
		this.iodiv.divKeys.write(whatkey(ev).char.charCodeAt(0));
	}

	// this function should be called from HTML "keypress" event from <canvas>
	keyDownCanvas(ev:KeyboardEvent) {
		if (!this.iocanvas || !this.iocanvas.canvasKeys) throw new Error("unexpected undefined twrWasmAsyncModule.canvasKeys");
		this.iocanvas.canvasKeys.write(whatkey(ev).char.charCodeAt(0));
	}

	processMsg(event: MessageEvent) {
		const msgType=event.data[0];
		const d=event.data[1];

		//console.log("twrWasmAsyncModule - got message: "+event.data)

		switch (msgType) {
			case "divout":
				if (this.iodiv)
					this.iodiv.charOut(d);
				else
					console.log('error - msg divout received but iodiv is undefined.')
				break;

			case "debug":
				debugLog(d);
				break;

			case "drawseq":
			{
				//console.log("twrAsyncMod got message drawseq");
				const [ds] =  d;
				if (this.iocanvas)
					this.iocanvas.drawSeq(ds);
				else
					console.log('error - msg drawseq received but canvas is undefined.')

				break;
			};

			case "startupFail":
				if (this.loadWasmReject)
					this.loadWasmReject(d);
				else
					throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmReject)");
				break;

			case "startupOkay":
				if (this.loadWasmResolve)
					this.loadWasmResolve(undefined);
				else
					throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmResolve)");
				break;

			case "executeCFail":
				if (this.executeCReject)
					this.executeCReject(d);
				else
					throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined executeCReject)");
				break;

			case "executeCOkay":
				if (this.executeCResolve)
					this.executeCResolve(d);
				else
					throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined executeCResolve)");
				break;

			default:
				throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: "+msgType);
		}
	}
}
