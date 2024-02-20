import { twrSignal } from "./twrsignal";

export type TWaitingCallsProxyParams = [SharedArrayBuffer];   // twrSignal

export class twrWaitingCalls {
	callCompleteSignal:twrSignal;

	constructor() {
		this.callCompleteSignal=new twrSignal();
	}

	startSleep(ms:number) {

		setTimeout(()=>{
			this.callCompleteSignal.signal();
		}, ms);
	}

	getProxyParams():TWaitingCallsProxyParams {
		return [this.callCompleteSignal.sharedArray];	
	}

}

export class twrWaitingCallsProxy {
	callCompleteSignal:twrSignal;

	constructor(params:TWaitingCallsProxyParams) {
		this.callCompleteSignal=new twrSignal(params[0]);
	}

	sleep(ms:number) {
		this.callCompleteSignal.reset();
		postMessage(["sleep", [ms]]);
		this.callCompleteSignal.wait();
	}

}
