import { twrWasmModuleBase } from "./twrmodbase";
import { twrSharedCircularBuffer } from "./twrcircular";
import { twrSignal } from "./twrsignal";
export interface ICanvasProps {
    charWidth: number;
    charHeight: number;
    foreColor: number;
    backColor: number;
    widthInChars: number;
    heightInChars: number;
}
export type TCanvasProxyParams = [ICanvasProps, SharedArrayBuffer, SharedArrayBuffer];
export interface ICanvas {
    props: ICanvasProps;
    charIn?: () => number;
    inkey?: () => number;
    getCanvasProxyParams?: () => TCanvasProxyParams;
    drawSeq: (ds: number) => void;
}
export declare class twrCanvas implements ICanvas {
    ctx: CanvasRenderingContext2D | undefined;
    props: ICanvasProps;
    owner: twrWasmModuleBase;
    drawCompleteSignal: twrSignal;
    canvasKeys: twrSharedCircularBuffer;
    constructor(element: HTMLCanvasElement | null | undefined, width: number, height: number, forecolor: string, backcolor: string, fontsize: number, modbase: twrWasmModuleBase);
    isValid(): boolean;
    getCanvasProxyParams(): TCanvasProxyParams;
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