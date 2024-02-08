import { TstdioVals } from "./twrmod.js";
import { twrDiv } from "./twrdiv.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrCanvas } from "./twrcanvas.js";
export declare class twrWasmAsyncModule {
    myWorker: Worker;
    divKeys: twrSharedCircularBuffer;
    canvasKeys: twrSharedCircularBuffer;
    loadWasmResolve?: (value: unknown) => void;
    loadWasmReject?: (reason?: any) => void;
    executeCResolve?: (value: unknown) => void;
    executeCReject?: (reason?: any) => void;
    init: boolean;
    canvas: twrCanvas;
    div: twrDiv;
    constructor();
    loadWasm(urToLoad: string | URL, opts: {
        stdio?: TstdioVals;
    }): Promise<unknown>;
    executeC(params: [string, ...(string | number | Uint8Array)[]]): Promise<unknown>;
    keyDownDiv(charcode: number): void;
    keyDownCanvas(charcode: number): void;
    processMsg(event: MessageEvent): void;
}
//# sourceMappingURL=twrasyncmod.d.ts.map