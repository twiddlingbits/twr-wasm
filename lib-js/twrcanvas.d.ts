import { twrWasmModuleBase } from "./twrmodbase.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrSignal } from "./twrsignal.js";
import { IConsoleCanvas, IConsoleCanvasProxy, ICanvasProps, TConsoleCanvasProxyParams } from "./twrcon.js";
export declare class twrConsoleCanvas implements IConsoleCanvas {
    ctx: CanvasRenderingContext2D;
    id: number;
    element: HTMLCanvasElement;
    props: ICanvasProps;
    cmdCompleteSignal?: twrSignal;
    canvasKeys?: twrSharedCircularBuffer;
    isAsyncMod: boolean;
    precomputedObjects: {
        [index: number]: (ImageData | {
            mem8: Uint8Array;
            width: number;
            height: number;
        }) | CanvasGradient;
    };
    constructor(element: HTMLCanvasElement);
    getProxyParams(): TConsoleCanvasProxyParams;
    getProp(name: keyof ICanvasProps): number;
    processMessage(msgType: string, data: [number, ...any[]], callingModule: twrWasmModuleBase): boolean;
    drawSeq(ds: number, owner: twrWasmModuleBase): void;
}
export declare class twrConsoleCanvasProxy implements IConsoleCanvasProxy {
    canvasKeys: twrSharedCircularBuffer;
    drawCompleteSignal: twrSignal;
    props: ICanvasProps;
    id: number;
    constructor(params: TConsoleCanvasProxyParams);
    charIn(): number;
    inkey(): number;
    getProp(propName: keyof ICanvasProps): number;
    drawSeq(ds: number): void;
}
//# sourceMappingURL=twrcanvas.d.ts.map