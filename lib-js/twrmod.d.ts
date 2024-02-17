import { IModOpts } from "./twrmodbase.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
export declare class twrWasmModule extends twrWasmModuleInJSMain {
    memory: WebAssembly.Memory;
    mem8: Uint8Array;
    malloc: (size: number) => Promise<number>;
    constructor(opts?: IModOpts);
    null(): void;
}
//# sourceMappingURL=twrmod.d.ts.map