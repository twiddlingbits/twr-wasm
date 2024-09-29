import { IWasmModule } from "./twrmod.js";
import { twrWasmBase } from "./twrwasmbase.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export default class twrLibDate extends twrLibrary {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    constructor();
    twrTimeEpoch(callingMod: IWasmModule | twrWasmBase): bigint;
}
//# sourceMappingURL=twrlibdate.d.ts.map