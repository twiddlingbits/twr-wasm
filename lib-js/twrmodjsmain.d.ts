import { IModOpts, twrWasmModuleBase } from "./twrmodbase.js";
import { IConsole } from "./twrcon.js";
export declare abstract class twrWasmModuleInJSMain extends twrWasmModuleBase {
    io: {
        [key: string]: IConsole;
    };
    ioNamesToID: {
        [key: string]: number;
    };
    constructor(opts?: IModOpts);
    divLog(...params: string[]): void;
}
//# sourceMappingURL=twrmodjsmain.d.ts.map