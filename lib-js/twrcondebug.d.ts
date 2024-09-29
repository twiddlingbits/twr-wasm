import { IConsoleStreamOut } from "./twrcon.js";
import { twrCodePageToUnicodeCodePoint } from "./twrliblocale.js";
import { IWasmModuleAsync } from "./twrmodasync.js";
import { IWasmModule } from "./twrmod.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export declare class twrConsoleDebug extends twrLibrary implements IConsoleStreamOut {
    id: number;
    logline: string;
    element: undefined;
    cpTranslate: twrCodePageToUnicodeCodePoint;
    imports: TLibImports;
    libSourcePath: string;
    interfaceName: string;
    constructor();
    charOut(ch: string): void;
    twrConCharOut(callingMod: IWasmModule | IWasmModuleAsync, ch: number, codePage: number): void;
    getProp(propName: string): number;
    twrConGetProp(callingMod: IWasmModule | IWasmModuleAsync, pn: number): number;
    putStr(str: string): void;
    twrConPutStr(callingMod: IWasmModule | IWasmModuleAsync, chars: number, codePage: number): void;
}
export default twrConsoleDebug;
//# sourceMappingURL=twrcondebug.d.ts.map