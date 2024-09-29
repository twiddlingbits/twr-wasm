import { IWasmModuleAsync } from "./twrmodasync.js";
import { IWasmModule } from "./twrmod.js";
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
    twrConGetProp: (callingMod: IWasmModule | IWasmModuleAsync, pn: number) => number;
    id: number;
    element?: HTMLElement;
}
export interface IConsoleStreamOut {
    twrConCharOut: (callingMod: IWasmModule | IWasmModuleAsync, c: number, codePage: number) => void;
    twrConPutStr: (callingMod: IWasmModule | IWasmModuleAsync, chars: number, codePage: number) => void;
    charOut: (ch: string) => void;
    putStr: (str: string) => void;
}
export interface IConsoleStreamIn {
    twrConCharIn_async: (callingMod: IWasmModuleAsync) => Promise<number>;
    twrConSetFocus: (callingMod: IWasmModuleAsync) => void;
    keyDown: (ev: KeyboardEvent) => void;
}
export interface IConsoleAddressable {
    twrConCls: (callingMod: IWasmModule | IWasmModuleAsync) => void;
    setRangeJS: (start: number, values: []) => void;
    twrConSetRange: (callingMod: IWasmModule | IWasmModuleAsync, chars: number, start: number, len: number) => void;
    twrConSetC32: (callingMod: IWasmModule | IWasmModuleAsync, location: number, char: number) => void;
    twrConSetReset: (callingMod: IWasmModule | IWasmModuleAsync, x: number, y: number, isset: boolean) => void;
    twrConPoint: (callingMod: IWasmModule | IWasmModuleAsync, x: number, y: number) => boolean;
    twrConSetCursor: (callingMod: IWasmModule | IWasmModuleAsync, pos: number) => void;
    twrConSetCursorXY: (callingMod: IWasmModule | IWasmModuleAsync, x: number, y: number) => void;
    twrConSetColors: (callingMod: IWasmModule | IWasmModuleAsync, foreground: number, background: number) => void;
}
export interface IConsoleDrawable {
    twrConDrawSeq: (mod: IWasmModuleAsync | IWasmModule, ds: number) => void;
    twrConLoadImage_async: (mod: IWasmModuleAsync, urlPtr: number, id: number) => Promise<number>;
}
export interface IConsoleTerminal extends IConsoleBase, IConsoleStreamOut, IConsoleStreamIn, IConsoleAddressable {
}
export interface IConsoleDiv extends IConsoleBase, IConsoleStreamOut, IConsoleStreamIn {
}
export interface IConsoleDebug extends IConsoleBase, IConsoleStreamOut {
}
export interface IConsoleCanvas extends IConsoleBase, IConsoleDrawable {
}
export interface IConsole extends IConsoleBase, Partial<IConsoleStreamOut>, Partial<IConsoleStreamIn>, Partial<IConsoleAddressable>, Partial<IConsoleDrawable> {
}
export declare class IOTypes {
    static readonly CHARREAD: number;
    static readonly CHARWRITE: number;
    static readonly ADDRESSABLE_DISPLAY: number;
    static readonly CANVAS2D: number;
    static readonly EVENTS: number;
    private constructor();
}
export declare function keyEventToCodePoint(ev: KeyboardEvent): number | undefined;
export declare function logToCon(con: IConsole, ...params: string[]): void;
//# sourceMappingURL=twrcon.d.ts.map