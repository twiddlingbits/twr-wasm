import { twrWasmModuleBase, ItwrModOpts } from "./twrmod.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
export declare class twrWasmAsyncModule extends twrWasmModuleBase {
    myWorker: Worker;
    divKeys: twrSharedCircularBuffer;
    canvasKeys: twrSharedCircularBuffer;
    loadWasmResolve?: (value: unknown) => void;
    loadWasmReject?: (reason?: any) => void;
    executeCResolve?: (value: unknown) => void;
    executeCReject?: (reason?: any) => void;
    init: boolean;
    constructor(opts: ItwrModOpts);
    loadWasm(urToLoad: string | URL): Promise<unknown>;
    executeC(params: [string, ...(string | number | Uint8Array)[]]): Promise<unknown>;
    keyDownDiv(ev: KeyboardEvent): void;
    keyDownCanvas(ev: KeyboardEvent): void;
    processMsg(event: MessageEvent): void;
}
//# sourceMappingURL=twrasyncmod.d.ts.map