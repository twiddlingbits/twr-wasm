import { IModOpts, IModParams, IModInWorkerParams } from "./twrmodbase.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrWaitingCalls } from "./twrwaitingcalls.js";
export type TAsyncModStartupMsg = {
    urlToLoad: string;
    modWorkerParams: IModInWorkerParams;
    modParams: IModParams;
};
export declare class twrWasmModuleAsync extends twrWasmModuleInJSMain {
    myWorker: Worker;
    malloc: (size: number) => Promise<number>;
    loadWasmResolve?: (value: void) => void;
    loadWasmReject?: (reason?: any) => void;
    callCResolve?: (value: unknown) => void;
    callCReject?: (reason?: any) => void;
    initLW: boolean;
    waitingcalls?: twrWaitingCalls;
    constructor(opts?: IModOpts);
    loadWasm(pathToLoad: string): Promise<void>;
    callC(params: [string, ...(string | number | Uint8Array)[]]): Promise<unknown>;
    callCImpl(fname: string, cparams?: number[]): Promise<unknown>;
    keyDownDiv(ev: KeyboardEvent): void;
    keyDownCanvas(ev: KeyboardEvent): void;
    processMsg(event: MessageEvent): void;
}
//# sourceMappingURL=twrmodasync.d.ts.map