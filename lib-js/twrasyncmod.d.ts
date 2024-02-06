import { TprintfVals } from "./twrmod.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrCanvas } from "./twrcanvas.js";
export declare class twrWasmAsyncModule {
    myWorker: Worker;
    stdinKeys: twrSharedCircularBuffer;
    canvasKeys: twrSharedCircularBuffer;
    loadWasmResolve?: (value: unknown) => void;
    loadWasmReject?: (reason?: any) => void;
    executeCResolve?: (value: unknown) => void;
    executeCReject?: (reason?: any) => void;
    init: boolean;
    canvas?: twrCanvas;
    constructor();
    loadWasm(urToLoad: string | URL, opts: {
        printf?: TprintfVals;
    }): Promise<unknown>;
    executeC(params: [string, ...(string | number | Uint8Array)[]]): Promise<unknown>;
    keyDownStdin(charcode: number): void;
    keyDownCanvasin(charcode: number): void;
    processMsg(event: MessageEvent): void;
}
//# sourceMappingURL=twrasyncmod.d.ts.map