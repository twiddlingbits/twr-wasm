// This class extends base to handle options when called in the main Java Script thread
import { twrDiv } from "./twrdiv.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
import { twrCanvas } from "./twrcanvas.js";
export class twrWasmModuleInJSMain extends twrWasmModuleBase {
    constructor(opts = {}) {
        super();
        let de, ce;
        if (typeof document === 'undefined')
            throw new Error("twrWasmModuleJSMain should only be created in JavaScript Main");
        de = document.getElementById("twr_iodiv");
        ce = document.getElementById("twr_iocanvas");
        if (opts.stdio == 'div' && !de)
            throw new Error("twrWasmModuleBase opts=='div' but twr_iodiv not defined");
        if (opts.stdio == 'canvas' && !ce)
            throw new Error("twrWasmModuleBase, opts=='canvas' but twr_iocanvas not defined");
        // set default opts based on elements found
        if (de)
            opts = Object.assign({ stdio: "div" }, opts);
        else if (ce)
            opts = Object.assign({ stdio: "canvas" }, opts);
        else
            opts = Object.assign({ stdio: "debug" }, opts);
        if (opts.stdio == 'canvas')
            opts = Object.assign({ windim: [64, 16] }, opts);
        else
            opts = Object.assign({ windim: [0, 0] }, opts);
        if (!opts.imports)
            opts.imports = {};
        if (!opts.backcolor)
            opts.backcolor = "black";
        if (!opts.forecolor)
            opts.forecolor = "white";
        if (!opts.fontsize)
            opts.fontsize = 16;
        this.modParams = {
            stdio: opts.stdio,
            windim: opts.windim,
            imports: opts.imports,
            forecolor: opts.forecolor,
            backcolor: opts.backcolor,
            fontsize: opts.fontsize
        };
        this.iocanvas = new twrCanvas(ce, this.modParams.windim[0], this.modParams.windim[1], this.modParams.forecolor, this.modParams.backcolor, this.modParams.fontsize, this);
        this.iodiv = new twrDiv(de, this.modParams.forecolor, this.modParams.backcolor, this.modParams.fontsize);
    }
}
//# sourceMappingURL=twrmodjsmain.js.map