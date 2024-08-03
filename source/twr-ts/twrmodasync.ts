import {IModOpts} from "./twrmodbase.js";
import {IAllProxyParams} from "./twrmodasyncproxy.js"
import {twrWasmModuleInJSMain} from "./twrmodjsmain.js"
import {twrWaitingCalls} from "./twrwaitingcalls.js"
import {IConsole } from "./twrcon.js";

// class twrWasmModuleAsync consist of two parts:
//   twrWasmModuleAsync runs in the main JavaScript event loop
//   twrWasmModuleAsyncProxy runs in a WebWorker thread
//      - the wasm module is loaded by the webworker, and C calls into javascript are handed by proxy classes which call the 'main' class via a message
//      - For example:
//          twrConCharOut (exported from JavaScript to C) might call twrConsoleTerminalProxy.CharOut
//          twrConsoleTerminalProxy.CharOut will send the message "term-charout".  
//          Ths message is received by twrWasmModuleAsync.processMsg(), which dispatches a call to twrConsoleTerminal.CharOut().

export type TModAsyncProxyStartupMsg = {
	urlToLoad: string,
	allProxyParams: IAllProxyParams,
};

// Interface for the error event
interface WorkerErrorEvent extends ErrorEvent {
	filename: string;
	lineno: number;
	colno: number;
	message: string;
	error: Error | null;
}
		
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
	myWorker:Worker;
	malloc:(size:number)=>Promise<number>;
	loadWasmResolve?: (value: void) => void;
	loadWasmReject?: (reason?: any) => void;
	callCResolve?: (value: unknown) => void;
	callCReject?: (reason?: any) => void;
	initLW=false;
	waitingcalls:twrWaitingCalls;

	constructor(opts?:IModOpts) {
		super(opts);

		this.malloc=(size:number)=>{throw new Error("Error - un-init malloc called.")};

		if (!window.Worker) throw new Error("This browser doesn't support web workers.");
		this.myWorker = new Worker(new URL('twrmodasyncproxy.js', import.meta.url), {type: "module" });
		this.myWorker.onerror = (event: WorkerErrorEvent) => {
			console.log("this.myWorker.onerror (undefined message typically means Worker failed to load)");
			console.log("event.message: "+event.message)
			throw event;
		};
		this.myWorker.onmessage= this.processMsg.bind(this);

		this.waitingcalls=new twrWaitingCalls();  // handle's calls that cross the worker thread - main js thread boundary

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

			// base class twrWasmModuleInJSMain member variables include:
			// d2dcanvas:twrCanvas, stdio:IConsole, stderr:IConsole
			// stdio & stderr are required to exist and be valid
			// d2dcanvas is optional 
			const allProxyParams={
				stdioConProxyParams: this.stdio.getProxyParams(), //change iodiv to stdio
				stdioConProxyClassName: this.stdio.getProxyClassName(), 
				stderrConProxyParams: this.stderr.getProxyParams(), //change iodiv to stdio
				stderrConProxyClassName: this.stderr.getProxyClassName(), 
				d2dcanvasProxyParams: this.d2dcanvas?this.d2dcanvas.getProxyParams():undefined,
				waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
			};
			const urlToLoad = new URL(pathToLoad, document.URL);
			const startMsg:TModAsyncProxyStartupMsg={ urlToLoad: urlToLoad.href, allProxyParams: allProxyParams};
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

	// this function is deprecated and here for backward compatibility
	keyDownDiv(ev:KeyboardEvent) {
		let destinationCon:IConsole;
		if (this.stdio.element && this.stdio.element.id==='twr_iodiv')
			destinationCon=this.stdio;
		else if (this.stderr.element && this.stderr.element.id==='twr_iodiv')
			destinationCon=this.stdio;
		else
			return;

		this.keyDown(destinationCon, ev);
	}

	// this function is deprecated and here for backward compatibility
	keyDownCanvas(ev:KeyboardEvent) {
		let destinationCon:IConsole;
		if (this.stdio.element && this.stdio.element.id==='twr_iocanvas')
			destinationCon=this.stdio;
		else if (this.stderr.element && this.stderr.element.id==='twr_iocanvas')
			destinationCon=this.stdio;
		else
			return;

		this.keyDown(destinationCon, ev);
	}

	// this function should be called from HTML "keydown" event
	keyDown(destinationCon:IConsole, ev:KeyboardEvent)  {
		if (!destinationCon.keys)
			throw new Error("keyDown requires twrModuleAsync");
		else {
			const r=this.keyEventProcess(ev);
			if (r) destinationCon.keys.write(r);
		}
	}

	processMsg(event: MessageEvent) {
		const msgType=event.data[0];
		const d=event.data[1];

		//console.log("twrWasmAsyncModule - got message: "+event.data)

		switch (msgType) {
			// twrCanvas
			case "drawseq":
			{
				//console.log("twrModAsync got message drawseq");
				const [ds] =  d;
				if (this.d2dcanvas)
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
					if (!this.stdio.processMessage(msgType, d))
						if (!this.stderr.processMessage(msgType, d))
							throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: "+msgType);
		}
	}
}
