// This class extends base to handle options when called in the main Java Script thread
import { twrDiv } from "./twrdiv.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
import { twrCanvas } from "./twrcanvas.js";
import { codePageUTF32 } from "./twrlocale.js";
export class twrWasmModuleInJSMain extends twrWasmModuleBase {
    iocanvas;
    d2dcanvas;
    iodiv;
    modParams;
    constructor(opts = {}, isWasmModule = false) {
        super(isWasmModule);
        if (typeof document === 'undefined')
            throw new Error("twrWasmModuleJSMain should only be created in JavaScript Main.");
        const eiodiv = document.getElementById("twr_iodiv");
        const eiocanvas = document.getElementById("twr_iocanvas");
        const ed2dcanvas = document.getElementById("twr_d2dcanvas");
        if (eiocanvas && ed2dcanvas)
            throw new Error("Both twr_iocanvas and twr_d2dcanvas defined. Currently only one canvas allowed.");
        if (opts.stdio == 'div' && !eiodiv)
            throw new Error("twrWasmModuleBase opts=='div' but twr_iodiv not defined");
        if (opts.stdio == 'canvas' && !eiocanvas)
            throw new Error("twrWasmModuleBase, opts=='canvas' but twr_iocanvas not defined");
        if (opts.isd2dcanvas && !ed2dcanvas)
            throw new Error("twrWasmModuleBase, opts.isd2dcanvas==true but twr_d2dcanvas not defined");
        // set default opts based on elements found
        if (eiodiv)
            opts = { stdio: "div", ...opts };
        else if (eiocanvas)
            opts = { stdio: "canvas", ...opts };
        else
            opts = { stdio: "debug", ...opts };
        if (!eiodiv && !eiocanvas)
            console.log("Since neither twr_iocanvas nor twr_iodiv is defined, stdout directed to debug console.");
        else
            console.log('twr-wasm: stdio set to: ', opts.stdio);
        if (eiocanvas)
            opts = { windim: [64, 16], ...opts };
        else
            opts = { windim: [0, 0], ...opts };
        if (!opts.imports)
            opts.imports = {};
        let styleIsDefault = false;
        if (!opts.backcolor) {
            styleIsDefault = true;
            opts.backcolor = "black";
        }
        if (!opts.forecolor) {
            styleIsDefault = true;
            opts.forecolor = "white";
        }
        if (!opts.fontsize) {
            styleIsDefault = true;
            opts.fontsize = 16;
        }
        if (opts.isd2dcanvas === undefined) {
            if (ed2dcanvas)
                opts.isd2dcanvas = true;
            else
                opts.isd2dcanvas = false;
        }
        this.modParams = {
            stdio: opts.stdio,
            windim: opts.windim,
            imports: opts.imports,
            forecolor: opts.forecolor,
            backcolor: opts.backcolor,
            styleIsDefault: styleIsDefault,
            fontsize: opts.fontsize,
            isd2dcanvas: opts.isd2dcanvas
        };
        this.iodiv = new twrDiv(eiodiv, this.modParams, this);
        this.iocanvas = new twrCanvas(eiocanvas, this.modParams, this);
        this.d2dcanvas = new twrCanvas(ed2dcanvas, this.modParams, this);
    }
    divLog(...params) {
        for (var i = 0; i < params.length; i++) {
            this.iodiv.stringOut(params[i].toString());
            this.iodiv.charOut(32, codePageUTF32); // space
        }
        this.iodiv.charOut(10, codePageUTF32);
    }
}
//# sourceMappingURL=twrmodjsmain.js.map