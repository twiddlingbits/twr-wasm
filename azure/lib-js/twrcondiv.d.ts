import { twrCodePageToUnicodeCodePoint } from "./twrliblocale.js";
import { IConsoleDiv, IConsoleDivParams } from "./twrcon.js";
import { IWasmModuleAsync } from "./twrmodasync.js";
import { IWasmModule } from "./twrmod.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export declare class twrConsoleDiv extends twrLibrary implements IConsoleDiv {
    id: number;
    element?: HTMLDivElement;
    CURSOR: string;
    cursorOn: boolean;
    lastChar: number;
    extraBR: boolean;
    cpTranslate?: twrCodePageToUnicodeCodePoint;
    keyBuffer: KeyboardEvent[];
    keyWaiting?: (key: number) => void;
    imports: TLibImports;
    libSourcePath: string;
    interfaceName: string;
    constructor(element?: HTMLDivElement, params?: IConsoleDivParams);
    private isHtmlEntityAtEnd;
    private removeHtmlEntityAtEnd;
    twrConSetFocus(): void;
    charOut(str: string): void;
    twrConCharOut(callingMod: IWasmModule | IWasmModuleAsync | undefined, ch: number, codePage: number): void;
    twrConGetProp(callingMod: IWasmModule | IWasmModuleAsync, pn: number): number;
    getProp(propName: string): number;
    keyDown(ev: KeyboardEvent): void;
    twrConCharIn_async(callingMod: IWasmModuleAsync): Promise<number>;
    putStr(str: string): void;
    twrConPutStr(callingMod: IWasmModule | IWasmModuleAsync, chars: number, codePage: number): void;
}
export default twrConsoleDiv;
//# sourceMappingURL=twrcondiv.d.ts.map