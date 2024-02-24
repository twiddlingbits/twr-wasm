// class twrWasmModule
// This class provides functions for loading a Web Assembly Module, and calling C code
//
// loadWasm() - loads a compiled wasm file (that is assumed to be linked with the twr wasm runtime library)
//            - options direct where stdout is directed.   The defaults are HTML div "twr_iodiv", then canvas "twr_iocanvas", then debug
//            - is you plan to use stdin, you must use twrWasmAsyncModule
// executeC() - execute a C function exported by the loaded Module.  Handle's numbers, string, files, and Uint8Array as parameters.
// various utility functions
//
// for blocking C functions, see class twrWasmModuleAsync
import { debugLogImpl } from "./twrdebug.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
export class twrWasmModule extends twrWasmModuleInJSMain {
    constructor(opts = {}) {
        super(opts);
        this.malloc = (size) => { throw new Error("error - un-init malloc called"); };
        let canvas;
        if (this.d2dcanvas.isValid())
            canvas = this.d2dcanvas;
        else
            canvas = this.iocanvas;
        this.modParams.imports = {
            twrDebugLog: debugLogImpl,
            twrDivCharOut: this.iodiv.charOut.bind(this.iodiv),
            twrCanvasGetProp: canvas.getProp.bind(canvas),
            twrCanvasDrawSeq: canvas.drawSeq.bind(canvas),
            twrCanvasCharIn: this.null,
            twrCanvasInkey: this.null,
            twrDivCharIn: this.null,
            twrSleep: this.null,
        };
    }
    null(inval) {
        throw new Error("call to unimplemented twrXXX import in twrWasmModule.  Use twrWasmModuleAsync ?");
    }
}
//# sourceMappingURL=twrmod.js.map