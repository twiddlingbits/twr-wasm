import { twrSignal } from "./twrsignal.js";
import { twrTimeImpl } from "./twrdate.js";
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
    time() {
        const ms = twrTimeImpl();
        this.parameters[0] = ms;
        this.callCompleteSignal.signal();
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
    time() {
        this.callCompleteSignal.reset();
        postMessage(["time"]);
        this.callCompleteSignal.wait();
        return this.parameters[0];
    }
}
//# sourceMappingURL=twrwaitingcalls.js.map