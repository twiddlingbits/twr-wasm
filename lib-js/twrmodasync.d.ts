import { IModOpts, IModParams, IModInWorkerParams } from "./twrmodbase.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrWaitingCalls } from "./twrwaitingcalls.js";
export type TAsyncModStartupMsg = {
    fileToLoad: string;
    modWorkerParams: IModInWorkerParams;
    modParams: IModParams;
};
export declare class twrWasmModuleAsync extends twrWasmModuleInJSMain {
    myWorker: Worker;
    memory: WebAssembly.Memory;
    mem8: Uint8Array;
    malloc: (size: number) => Promise<number>;
    loadWasmResolve?: (value: void) => void;
    loadWasmReject?: (reason?: any) => void;
    executeCResolve?: (value: unknown) => void;
    executeCReject?: (reason?: any) => void;
    initLW: boolean;
    waitingcalls?: twrWaitingCalls;
    constructor(opts?: IModOpts);
    loadWasm(fileToLoad: string): Promise<void>;
    executeC(params: [string, ...(string | number | Uint8Array)[]]): Promise<unknown>;
    executeCImpl(fname: string, cparams?: number[]): Promise<unknown>;
    keyDownDiv(ev: KeyboardEvent): void;
    keyDownCanvas(ev: KeyboardEvent): void;
    processMsg(event: MessageEvent): void;
}
//# sourceMappingURL=twrmodasync.d.ts.map