import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
export interface IConsoleDivParams {
    foreColor?: string;
    backColor?: string;
    fontSize?: number;
}
export interface IConsoleTerminalParams extends IConsoleDivParams {
    widthInChars?: number;
    heightInChars?: number;
}
export interface IConsoleBaseProps {
    type: number;
    [key: string]: number;
}
export interface IConsoleTerminalProps extends IConsoleBaseProps {
    cursorPos: number;
    charWidth: number;
    charHeight: number;
    foreColorAsRGB: number;
    backColorAsRGB: number;
    widthInChars: number;
    heightInChars: number;
    fontSize: number;
    canvasWidth: number;
    canvasHeight: number;
}
export interface ICanvasProps extends IConsoleBaseProps {
    canvasWidth: number;
    canvasHeight: number;
}
export interface IConsoleBase {
    getProp: (propName: string) => number;
    getProxyParams: () => TConsoleProxyParams;
    processMessage(msgType: string, data: [number, ...any[]], callingModule: twrWasmModuleBase): boolean;
    id: number;
    element?: HTMLElement;
}
export interface IConsoleBaseProxy {
    getProp: (propName: string) => number;
    id: number;
}
export interface IConsoleStream {
    charOut: (c: number, codePage: number) => void;
    putStr: (str: string) => void;
    keyDown: (ev: KeyboardEvent) => void;
    keys?: twrSharedCircularBuffer;
}
export interface IConsoleStreamProxy {
    charOut: (c: number, codePage: number) => void;
    putStr: (str: string) => void;
    charIn: () => number;
    setFocus: () => void;
}
export interface IConsoleAddressable {
    cls: () => void;
    setRange: (start: number, values: []) => void;
    setC32: (location: number, char: number) => void;
    setReset: (x: number, y: number, isset: boolean) => void;
    point: (x: number, y: number) => boolean;
    setCursor: (pos: number) => void;
    setCursorXY: (x: number, y: number) => void;
    setColors: (foreground: number, background: number) => void;
}
export interface IConsoleDrawable {
    drawSeq: (ds: number, owner: twrWasmModuleBase) => void;
}
export interface IConsoleDrawableProxy {
    drawSeq: (ds: number) => void;
    loadImage: (urlPtr: number, id: number) => number;
}
export interface IConsoleTerminal extends IConsoleBase, IConsoleStream, IConsoleAddressable {
}
export interface IConsoleTerminalProxy extends IConsoleBaseProxy, IConsoleStreamProxy, IConsoleAddressable {
}
export interface IConsoleDiv extends IConsoleBase, IConsoleStream {
}
export interface IConsoleDivProxy extends IConsoleBaseProxy, IConsoleStreamProxy {
}
export interface IConsoleDebug extends IConsoleBase, IConsoleStream {
}
export interface IConsoleDebugProxy extends IConsoleBaseProxy, IConsoleStreamProxy {
}
export interface IConsoleCanvas extends IConsoleBase, IConsoleDrawable {
}
export interface IConsoleCanvasProxy extends IConsoleBaseProxy, IConsoleDrawableProxy {
}
export interface IConsole extends IConsoleBase, Partial<IConsoleStream>, Partial<IConsoleAddressable>, Partial<IConsoleDrawable> {
}
export interface IConsoleProxy extends IConsoleBaseProxy, Partial<IConsoleStreamProxy>, Partial<IConsoleAddressable>, Partial<IConsoleDrawableProxy> {
}
export type TConsoleDebugProxyParams = ["twrConsoleDebugProxy", number];
export type TConsoleDivProxyParams = ["twrConsoleDivProxy", number, SharedArrayBuffer];
export type TConsoleTerminalProxyParams = ["twrConsoleTerminalProxy", number, SharedArrayBuffer, SharedArrayBuffer];
export type TConsoleCanvasProxyParams = ["twrConsoleCanvasProxy", number, ICanvasProps, SharedArrayBuffer, SharedArrayBuffer, SharedArrayBuffer];
export type TConsoleProxyParams = TConsoleTerminalProxyParams | TConsoleDivProxyParams | TConsoleDebugProxyParams | TConsoleCanvasProxyParams;
export declare class IOTypes {
    static readonly CHARREAD: number;
    static readonly CHARWRITE: number;
    static readonly ADDRESSABLE_DISPLAY: number;
    static readonly CANVAS2D: number;
    static readonly EVENTS: number;
    private constructor();
}
export declare function keyDownUtil(destinationCon: IConsole, ev: KeyboardEvent): void;
//# sourceMappingURL=twrcon.d.ts.map