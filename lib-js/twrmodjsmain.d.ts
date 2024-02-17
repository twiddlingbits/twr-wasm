import { twrDiv } from "./twrdiv.js";
import { IModParams, IModOpts, twrWasmModuleBase } from "./twrmodbase.js";
import { twrCanvas } from "./twrcanvas.js";
export declare abstract class twrWasmModuleInJSMain extends twrWasmModuleBase {
    iocanvas: twrCanvas;
    iodiv: twrDiv;
    modParams: IModParams;
    constructor(opts?: IModOpts);
}
//# sourceMappingURL=twrmodjsmain.d.ts.map