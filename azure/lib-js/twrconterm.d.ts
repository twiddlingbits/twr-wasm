import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrCodePageToUnicodeCodePoint } from "./twrlocale.js";
import { IConsoleTerminal, IConsoleTerminalProps, IConsoleTerminalParams, IConsoleTerminalProxy } from "./twrcon.js";
import { TConsoleTerminalProxyParams } from "./twrcon.js";
export declare class twrConsoleTerminal implements IConsoleTerminal {
    element: HTMLElement;
    id: number;
    ctx: CanvasRenderingContext2D;
    keys?: twrSharedCircularBuffer;
    returnValue?: twrSharedCircularBuffer;
    props: IConsoleTerminalProps;
    size: number;
    cellWidth: number;
    cellHeight: number;
    cellW1: number;
    cellW2: number;
    cellH1: number;
    cellH2: number;
    cellH3: number;
    isCursorVisible: boolean;
    videoMem: number[];
    foreColorMem: number[];
    backColorMem: number[];
    cpTranslate: twrCodePageToUnicodeCodePoint;
    constructor(canvasElement: HTMLCanvasElement, params?: IConsoleTerminalParams);
    getProxyParams(): TConsoleTerminalProxyParams;
    getProp(propName: string): number;
    keyDown(ev: KeyboardEvent): void;
    processMessage(msgType: string, data: [number, ...any[]]): boolean;
    private RGB_TO_RGBA;
    private eraseLine;
    charOut(c: number, codePage: number): void;
    putStr(str: string): void;
    setC32(location: number, c32: number): void;
    cls(): void;
    private setFillStyleRGB;
    drawTrs80Graphic(offset: number, val: number, fgc: number, bgc: number): void;
    private drawCell;
    setRange(start: number, values: []): void;
    private drawRange;
    /*************************************************/
    setReset(x: number, y: number, isset: boolean): void;
    point(x: number, y: number): boolean;
    setCursor(location: number): void;
    setCursorXY(x: number, y: number): void;
    setColors(foreground: number, background: number): void;
}
export declare class twrConsoleTerminalProxy implements IConsoleTerminalProxy {
    keys: twrSharedCircularBuffer;
    returnValue: twrSharedCircularBuffer;
    id: number;
    constructor(params: TConsoleTerminalProxyParams);
    getProp(propName: string): number;
    charIn(): number;
    point(x: number, y: number): boolean;
    charOut(ch: number, codePoint: number): void;
    putStr(str: string): void;
    cls(): void;
    setRange(start: number, values: []): void;
    setC32(location: number, char: number): void;
    setReset(x: number, y: number, isset: boolean): void;
    setCursor(pos: number): void;
    setCursorXY(x: number, y: number): void;
    setColors(foreground: number, background: number): void;
    setFocus(): void;
}
//# sourceMappingURL=twrconterm.d.ts.map