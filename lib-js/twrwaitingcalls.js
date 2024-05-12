import { twrSignal } from "./twrsignal.js";
// This class is used in the  Main JS thread 
export class twrWaitingCalls {
    callCompleteSignal;
    parameters;
    constructor() {
        this.callCompleteSignal = new twrSignal();
        this.parameters = new Uint32Array(new SharedArrayBuffer(4));
    }
    startSleep(ms) {
        setTimeout(() => {
            this.callCompleteSignal.signal();
        }, ms);
    }
    getProxyParams() {
        return [this.callCompleteSignal.sharedArray, this.parameters.buffer];
    }
    processMessage(msgType, data) {
        switch (msgType) {
            case "sleep":
                const [ms] = data;
                this.startSleep(ms);
                break;
            default:
                return false;
        }
        return true;
    }
}
// This class is used in the worker thread 
export class twrWaitingCallsProxy {
    callCompleteSignal;
    parameters;
    constructor(params) {
        this.callCompleteSignal = new twrSignal(params[0]);
        this.parameters = new Uint32Array(params[1]);
    }
    sleep(ms) {
        this.callCompleteSignal.reset();
        postMessage(["sleep", [ms]]);
        this.callCompleteSignal.wait();
    }
}
//# sourceMappingURL=twrwaitingcalls.js.map