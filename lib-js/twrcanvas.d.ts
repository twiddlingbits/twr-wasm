import { twrWasmModuleBase, IModParams } from "./twrmodbase.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrSignal } from "./twrsignal.js";
export interface ICanvasProps {
    charWidth: number;
    charHeight: number;
    foreColor: number;
    backColor: number;
    widthInChars: number;
    heightInChars: number;
    canvasWidth: number;
    canvasHeight: number;
}
export type TCanvasProxyParams = [ICanvasProps, SharedArrayBuffer, SharedArrayBuffer];
export interface ICanvas {
    props: ICanvasProps;
    charIn?: () => number;
    inkey?: () => number;
    getProxyParams?: () => TCanvasProxyParams;
    drawSeq: (ds: number) => void;
}
export declare class twrCanvas implements ICanvas {
    ctx: CanvasRenderingContext2D | undefined;
    props: ICanvasProps;
    owner: twrWasmModuleBase;
    cmdCompleteSignal?: twrSignal;
    canvasKeys?: twrSharedCircularBuffer;
    imageData: {
        [index: number]: (ImageData | {
            mem8: Uint8Array;
            width: number;
            height: number;
        });
    };
    constructor(element: HTMLCanvasElement | null | undefined, modParams: IModParams, modbase: twrWasmModuleBase);
    isValid(): boolean;
    getProxyParams(): TCanvasProxyParams;
    getProp(pn: number): number;
    drawSeq(ds: number): void;
}
export declare class twrCanvasProxy implements ICanvas {
    canvasKeys: twrSharedCircularBuffer;
    drawCompleteSignal: twrSignal;
    props: ICanvasProps;
    owner: twrWasmModuleBase;
    constructor(params: TCanvasProxyParams, owner: twrWasmModuleBase);
    charIn(): number;
    inkey(): number;
    getProp(pn: number): number;
    drawSeq(ds: number): void;
}
//# sourceMappingURL=twrcanvas.d.ts.map