import {IModOpts, IModParams, IModProxyParams} from "./twrmodbase.js";
import {twrDebugLogImpl} from "./twrdebug.js";
import {twrWasmModuleInJSMain} from "./twrmodjsmain.js"
import {twrWaitingCalls} from "./twrwaitingcalls.js"
import {twrCanvas} from "./twrcanvas.js";

export type TAsyncModStartupMsg = {
	urlToLoad: string,
	modAsyncProxyParams: IModProxyParams,
	modParams: IModParams 
};
		
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
	myWorker:Worker;
	malloc:(size:number)=>Promise<number>;
	loadWasmResolve?: (value: void) => void;
	loadWasmReject?: (reason?: any) => void;
	callCResolve?: (value: unknown) => void;
	callCReject?: (reason?: any) => void;
	initLW=false;
	waitingcalls?:twrWaitingCalls;


	constructor(opts?:IModOpts) {
		super(opts);

		this.malloc=(size:number)=>{throw new Error("Error - un-init malloc called.")};

		if (!window.Worker) throw new Error("This browser doesn't support web workers.");
		this.myWorker = new Worker(new URL('twrmodasyncproxy.js', import.meta.url), {type: "module" });
		this.myWorker.onerror = function(event) {
			throw new Error('Worker.onerror called (Worker failed to load?): ' + event.message);
		 };
		this.myWorker.onmessage= this.processMsg.bind(this);
	}

	// overrides base implementation
	async loadWasm(pathToLoad:string) {
		if (this.initLW) 	throw new Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");
		this.initLW=true;

		return new Promise<void>((resolve, reject)=>{
			this.loadWasmResolve=resolve;
			this.loadWasmReject=reject;

			this.malloc = (size:number) => {
				return this.callCImpl("malloc", [size]) as Promise<number>;
			}

			this.waitingcalls=new twrWaitingCalls();  // handle's calls that cross the worker thread - main js thread boundary

			let canvas:twrCanvas;
			if (this.d2dcanvas.isValid()) canvas=this.d2dcanvas;
			else canvas=this.iocanvas;

			const modAsyncProxyParams={
				divProxyParams: this.iodiv.getProxyParams(), 
				canvasProxyParams: canvas.getProxyParams(),
				waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
			};
			const urlToLoad = new URL(pathToLoad, document.URL);
			const startMsg:TAsyncModStartupMsg={ urlToLoad: urlToLoad.href, modAsyncProxyParams: modAsyncProxyParams, modParams: this.modParams};
			this.myWorker.postMessage(['startup', startMsg]);
		});
	}

	async callC(params:[string, ...(string|number|bigint|Uint8Array)[]]) {
		const cparams=await this.preCallC(params); // will also validate params[0]
		const retval=await this.callCImpl(params[0], cparams);
		await this.postCallC(cparams, params);
		return retval;
	}	

	async callCImpl(fname:string, cparams:(number|bigint)[]=[]) {
		return new Promise((resolve, reject)=>{
			this.callCResolve=resolve;
			this.callCReject=reject;
			this.myWorker.postMessage(['callC', fname, cparams]);
		});
	}
	
	private keyEventProcess(ev:KeyboardEvent) {
		if ( !ev.isComposing  && !ev.metaKey && ev.key!="Control" && ev.key!="Alt" ) {
			//console.log("keyDownDiv: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
			if (ev.key.length==1)
				return ev.key.codePointAt(0);
			else {
				switch(ev.key) {
					case 'Backspace': return 8;
					case 'Enter': 		return 10;
					case 'Escape': 	return 0x1B;
					case 'Delete': 	return 0x7F;
					case 'ArrowLeft':	return 0x2190;
					case 'ArrowUp':	return 0x2191;
					case 'ArrowRight':return 0x2192;
					case 'ArrowDown':	return 0x2193;
				}
				console.log("keyDownDiv SKIPPED: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
			}
		}
		else {
			console.log("keyDownDiv SKIPPED-2: ",ev.key, ev.code, ev.key.codePointAt(0), ev);
		}

		return undefined;
	}

	// this function should be called from HTML "keydown" event from <div>
	keyDownDiv(ev:KeyboardEvent) {
		if (!this.iodiv || !this.iodiv.divKeys) throw new Error("unexpected undefined twrWasmAsyncModule.divKeys");
		const r=this.keyEventProcess(ev);
		if (r) this.iodiv.divKeys.write(r);
	}

	// this function should be called from HTML "keydown" event from <canvas>
	keyDownCanvas(ev:KeyboardEvent) {
		if (!this.iocanvas || !this.iocanvas.canvasKeys) throw new Error("unexpected undefined twrWasmAsyncModule.canvasKeys");
		const r=this.keyEventProcess(ev);
		if (r) this.iocanvas.canvasKeys.write(r);
	}

	processMsg(event: MessageEvent) {
		const msgType=event.data[0];
		const d=event.data[1];

		//console.log("twrWasmAsyncModule - got message: "+event.data)

		switch (msgType) {
			case "divout":
				const [c, codePage]=d;
				if (this.iodiv.isValid())
					this.iodiv.charOut(c, codePage);
				else
					console.log('error - msg divout received but iodiv is undefined.')
				break;

			case "debug":
				twrDebugLogImpl(d);
				break;

			case "drawseq":
			{
				//console.log("twrModAsync got message drawseq");
				const [ds] =  d;
				if (this.iocanvas.isValid())
					this.iocanvas.drawSeq(ds);
				else if (this.d2dcanvas.isValid())
					this.d2dcanvas.drawSeq(ds);
				else
					throw new Error('msg drawseq received but canvas is undefined.')

				break;
			}

			case "setmemory":
				this.memory=d;
				if (!this.memory) throw new Error("unexpected error - undefined memory in startupOkay msg");
				this.mem8 = new Uint8Array(this.memory.buffer);
				this.mem32 = new Uint32Array(this.memory.buffer);
				this.memD = new Float64Array(this.memory.buffer);
				//console.log("memory set",this.mem8.length);
				break;

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

			case "callCFail":
				if (this.callCReject)
					this.callCReject(d);
				else
					throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCReject)");
				break;

			case "callCOkay":
				if (this.callCResolve)
					this.callCResolve(d);
				else
					throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCResolve)");
				break;

			default:
				if (!this.waitingcalls) throw new Error ("internal error: this.waitingcalls undefined.")
				if (!this.waitingcalls.processMessage(msgType, d))
					throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: "+msgType);
		}
	}
}
