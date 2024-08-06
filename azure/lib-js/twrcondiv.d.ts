import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrCodePageToUnicodeCodePoint } from "./twrlocale.js";
import { IConsoleDiv, IConsoleDivProxy, IConsoleDivParams, TConsoleDivProxyParams } from "./twrcon.js";
export declare class twrConsoleDiv implements IConsoleDiv {
    element: HTMLDivElement;
    id: number;
    keys?: twrSharedCircularBuffer;
    CURSOR: string;
    cursorOn: boolean;
    lastChar: number;
    extraBR: boolean;
    cpTranslate: twrCodePageToUnicodeCodePoint;
    constructor(element: HTMLDivElement, params: IConsoleDivParams);
    private isHtmlEntityAtEnd;
    private removeHtmlEntityAtEnd;
    charOut(ch: number, codePage: number): void;
    getProp(propName: string): number;
    getProxyParams(): TConsoleDivProxyParams;
    keyDown(ev: KeyboardEvent): void;
    processMessage(msgType: string, data: [number, ...any[]]): boolean;
    putStr(str: string): void;
}
export declare class twrConsoleDivProxy implements IConsoleDivProxy {
    keys: twrSharedCircularBuffer;
    id: number;
    constructor(params: TConsoleDivProxyParams);
    charIn(): number;
    inkey(): number;
    charOut(ch: number, codePoint: number): void;
    putStr(str: string): void;
    getProp(propName: string): number;
    setFocus(): void;
}
//# sourceMappingURL=twrcondiv.d.ts.map