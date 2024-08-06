import { IConsoleStream, IConsoleStreamProxy, TConsoleDebugProxyParams } from "./twrcon.js";
import { twrCodePageToUnicodeCodePoint } from "./twrlocale.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
export declare class twrConsoleDebug implements IConsoleStream {
    logline: string;
    element: undefined;
    id: number;
    cpTranslate: twrCodePageToUnicodeCodePoint;
    constructor();
    charOut(ch: number, codePage: number): void;
    getProp(propName: string): number;
    getProxyParams(): TConsoleDebugProxyParams;
    keyDown(ev: KeyboardEvent): void;
    processMessage(msgType: string, data: [number, ...any[]], callingModule: twrWasmModuleBase): boolean;
    putStr(str: string): void;
}
export declare class twrConsoleDebugProxy implements IConsoleStreamProxy {
    id: number;
    constructor(params: TConsoleDebugProxyParams);
    charIn(): number;
    setFocus(): void;
    charOut(ch: number, codePoint: number): void;
    putStr(str: string): void;
    getProp(propName: string): number;
}
//# sourceMappingURL=twrcondebug.d.ts.map