import { IModOpts } from "./twrmodbase.js";
import { IAllProxyParams } from "./twrmodasyncproxy.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrWaitingCalls } from "./twrwaitingcalls.js";
export type TModAsyncProxyStartupMsg = {
    urlToLoad: string;
    allProxyParams: IAllProxyParams;
};
interface ICallCPromise {
    callCResolve: (value: unknown) => void;
    callCReject: (reason?: any) => void;
}
export declare class twrWasmModuleAsync extends twrWasmModuleInJSMain {
    myWorker: Worker;
    malloc: (size: number) => Promise<number>;
    loadWasmResolve?: (value: void) => void;
    loadWasmReject?: (reason?: any) => void;
    callCMap: Map<number, ICallCPromise>;
    uniqueInt: number;
    initLW: boolean;
    waitingcalls: twrWaitingCalls;
    constructor(opts?: IModOpts);
    loadWasm(pathToLoad: string): Promise<void>;
    callC(params: [string, ...(string | number | bigint | Uint8Array)[]]): Promise<unknown>;
    callCImpl(fname: string, cparams?: (number | bigint)[]): Promise<unknown>;
    keyDown(ev: KeyboardEvent): void;
    keyDownDiv(ev: KeyboardEvent): void;
    keyDownCanvas(ev: KeyboardEvent): void;
    processMsg(event: MessageEvent<[string, ...any[]]>): void;
}
export {};
//# sourceMappingURL=twrmodasync.d.ts.map