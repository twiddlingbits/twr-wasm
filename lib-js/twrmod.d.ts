import { IModOpts } from "./twrmodbase.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
export declare class twrWasmModule extends twrWasmModuleInJSMain {
    malloc: (size: number) => Promise<number>;
    constructor(opts?: IModOpts);
    null(inval?: any): void;
}
//# sourceMappingURL=twrmod.d.ts.map