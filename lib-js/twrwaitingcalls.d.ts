import { twrSignal } from "./twrsignal";
export type TWaitingCallsProxyParams = [SharedArrayBuffer];
export declare class twrWaitingCalls {
    callCompleteSignal: twrSignal;
    constructor();
    startSleep(ms: number): void;
    getProxyParams(): TWaitingCallsProxyParams;
}
export declare class twrWaitingCallsProxy {
    callCompleteSignal: twrSignal;
    constructor(params: TWaitingCallsProxyParams);
    sleep(ms: number): void;
}
//# sourceMappingURL=twrwaitingcalls.d.ts.map