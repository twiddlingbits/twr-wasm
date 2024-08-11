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
    returnValue?: twrSharedCircularBuffer;
    isAsyncMod: boolean;
    precomputedObjects: {
        [index: number]: (ImageData | {
            mem8: Uint8Array;
            width: number;
            height: number;
        }) | CanvasGradient | HTMLImageElement;
    };
    constructor(element: HTMLCanvasElement);
    getProxyParams(): TConsoleCanvasProxyParams;
    getProp(name: keyof ICanvasProps): number;
    processMessage(msgType: string, data: [number, ...any[]], callingModule: twrWasmModuleBase): boolean;
    private loadImage;
    drawSeq(ds: number, owner: twrWasmModuleBase): void;
}
export declare class twrConsoleCanvasProxy implements IConsoleCanvasProxy {
    canvasKeys: twrSharedCircularBuffer;
    drawCompleteSignal: twrSignal;
    props: ICanvasProps;
    id: number;
    returnValue: twrSharedCircularBuffer;
    constructor(params: TConsoleCanvasProxyParams);
    charIn(): number;
    inkey(): number;
    getProp(propName: keyof ICanvasProps): number;
    drawSeq(ds: number): void;
    loadImage(urlPtr: number, id: number): number;
}
//# sourceMappingURL=twrconcanvas.d.ts.map