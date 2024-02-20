import { twrSignal } from "./twrsignal";
export class twrWaitingCalls {
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