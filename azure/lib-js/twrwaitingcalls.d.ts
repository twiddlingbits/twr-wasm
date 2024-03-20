import { twrSignal } from "./twrsignal.js";
export type TWaitingCallsProxyParams = [SharedArrayBuffer, SharedArrayBuffer];
export declare class twrWaitingCalls {
    callCompleteSignal: twrSignal;
    parameters: Uint32Array;
    constructor();
    private startSleep;
    private time;
    getProxyParams(): TWaitingCallsProxyParams;
    processMessage(msgType: string, data: any[]): boolean;
}
export declare class twrWaitingCallsProxy {
    callCompleteSignal: twrSignal;
    parameters: Uint32Array;
    constructor(params: TWaitingCallsProxyParams);
    sleep(ms: number): void;
    time(): number;
}
//# sourceMappingURL=twrwaitingcalls.d.ts.map