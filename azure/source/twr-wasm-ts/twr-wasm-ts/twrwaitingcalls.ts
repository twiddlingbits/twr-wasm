import { twrSignal } from "./twrsignal.js";
import {twrTimeImpl} from "./twrdate.js"

// These classes are used to proxy a call across the worker thread - main thread boundary and wait for the result

export type TWaitingCallsProxyParams = [SharedArrayBuffer, SharedArrayBuffer];   // twrSignal, parameters 

// This class is used in the  Main JS thread 
export class twrWaitingCalls {
	callCompleteSignal:twrSignal;
	parameters:Uint32Array;

	constructor() {
		this.callCompleteSignal=new twrSignal();
		this.parameters=new Uint32Array(new SharedArrayBuffer(4));
	}

	private startSleep(ms:number) {

		setTimeout(()=>{
			this.callCompleteSignal.signal();
		}, ms);
		
	}

	private time() {
		const ms=twrTimeImpl();
		this.parameters[0]=ms;
		this.callCompleteSignal.signal();
	}

	getProxyParams():TWaitingCallsProxyParams {
		return [this.callCompleteSignal.sharedArray, this.parameters.buffer as SharedArrayBuffer];	
	}

	processMessage(msgType:string, data:any[]):boolean {
		switch (msgType) {
			case "sleep":
				const [ms] =  data;
				this.startSleep(ms);
				break;

			case "time":
				this.time();
				break;
			
			default:
				return false;
		}

		return true;
	}

}

// This class is used in the worker thread 
export class twrWaitingCallsProxy {
	callCompleteSignal:twrSignal;
	parameters:Uint32Array;

	constructor(params:TWaitingCallsProxyParams) {
		this.callCompleteSignal=new twrSignal(params[0]);
		this.parameters=new Uint32Array(params[1]);
	}

	sleep(ms:number) {
		this.callCompleteSignal.reset();
		postMessage(["sleep", [ms]]);
		this.callCompleteSignal.wait();
	}

	time() {
		this.callCompleteSignal.reset();
		postMessage(["time"]);
		this.callCompleteSignal.wait();
		return this.parameters[0];
	}

}
