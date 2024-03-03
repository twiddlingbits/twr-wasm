import { twrSignal } from "./twrsignal.js";
export class twrWaitingCalls {
    callCompleteSignal;
    constructor() {
        this.callCompleteSignal = new twrSignal();
    }
    startSleep(ms) {
        setTimeout(() => {
            this.callCompleteSignal.signal();
        }, ms);
    }
    getProxyParams() {
        return [this.callCompleteSignal.sharedArray];
    }
}
export class twrWaitingCallsProxy {
    callCompleteSignal;
    constructor(params) {
        this.callCompleteSignal = new twrSignal(params[0]);
    }
    sleep(ms) {
        this.callCompleteSignal.reset();
        postMessage(["sleep", [ms]]);
        this.callCompleteSignal.wait();
    }
}
//# sourceMappingURL=twrwaitingcalls.js.map