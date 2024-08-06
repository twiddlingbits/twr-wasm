import { IModOpts } from "./twrmodbase.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrCodePageToUnicodeCodePoint } from "./twrlocale.js";
export declare class twrWasmModule extends twrWasmModuleInJSMain {
    malloc: (size: number) => Promise<number>;
    imports: WebAssembly.ModuleImports;
    cpTranslate: twrCodePageToUnicodeCodePoint;
    constructor(opts?: IModOpts);
    loadWasm(pathToLoad: string): Promise<void>;
    null(inval?: any): void;
}
//# sourceMappingURL=twrmod.d.ts.map