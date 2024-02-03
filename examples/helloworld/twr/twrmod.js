// class twrWasmModule
// This class provides functions for loading a Web Assembly Module, and calling C code
//
// loadWasm() - loads a compiled wasm file (that is assumed to be linked with the twr wasm runtime library)
//            - options direct where stdout and the debugcon are directed.   The defaults are HTML div "twr_stdout" and the web debug console.
//            - as of this writing, you need to use twrWasmAsyncModule for stdin.
// executeC() - execute a C function exported by the loaded Module.  Handle's numbers, string, files, and Uint8Array as parameters.
// various utility functions
//
// for blocking C functions, see class twrWasmAsyncModule
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { syncCharToStdout as charToStdout, syncDebugLog as debugLog } from "./twrdiv.js";
import { twrCanvas } from "./twrcanvas.js";
export function twrIsFileName(x) {
    return x.twrFileName !== undefined;
}
export class twrWasmModule {
    constructor() {
        if (!(typeof document === 'undefined')) {
            const element = document.getElementById("twr_canvas");
            if (element)
                this.canvas = new twrCanvas(element);
        }
    }
    loadWasm(urToLoad, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("loadwasm: ", urToLoad, opts);
            const { // obj deconstruct syntax
            printf = "debugcon", imports = {}, } = opts;
            try {
                let response = yield fetch(urToLoad);
                let wasmBytes = yield response.arrayBuffer();
                const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
                this.mem8 = new Uint8Array(memory.buffer);
                let allimports = {
                    memory: memory,
                    twrStdout: charToStdout,
                    twrDebugLog: debugLog,
                    twrStdin: this.charToIn
                };
                if (this.canvas)
                    allimports = Object.assign(Object.assign({}, allimports), { twrCanvasGetAvgCharWidth: this.canvas.getAvgCharWidth, twrCanvasGetCharHeight: this.canvas.getCharHeight, twrCanvasGetColorWhite: this.canvas.getColorWhite, twrCanvasGetColorBlack: this.canvas.getColorBlack, twrCanvasFillRect: this.canvas.fillRect, twrCanvasCharOut: this.canvas.charOut });
                allimports = Object.assign(Object.assign({}, allimports), imports);
                let instance = yield WebAssembly.instantiate(wasmBytes, { env: allimports });
                this.exports = instance.instance.exports;
                this.twrInit(printf);
            }
            catch (err) {
                console.log('WASM instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
                throw err;
            }
        });
    }
    twrInit(printf) {
        let p;
        if (printf == "div_twr_stdout")
            p = 1;
        else if (printf == "null")
            p = 2;
        else
            p = 0; // printf=="debugcon" or unknown
        const init = this.exports.twr_wasm_init;
        init(p);
    }
    charToIn() {
        return 0;
    }
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    /* executeC takes an array where:
    * the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
    * and the next entries are a variable numnber of parameters to pass to the C function, of type
    * number - cnverted to int32 or float64 as appropriate
    * string - converted to a an index (ptr) into a module Memory returend via stringToMem()
    * twrFileName - the file contents are loaded into module Memory via fileToMem(), and two C paramters are generated - index (pointer) to the memory, and length
    * Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length
    */
    executeC(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (params.length == 0)
                throw new Error("missing function name");
            if (!this.exports)
                throw new Error("this.exports undefined");
            if (!this.exports[params[0]])
                throw new Error("executeC: function '" + params[0] + "' not in export table");
            let cparams = [];
            let ci = 0;
            for (let i = 1; i < params.length; i++) {
                const p = params[i];
                switch (typeof p) {
                    case 'number':
                        cparams[ci++] = p;
                        break;
                    case 'string':
                        cparams[ci++] = this.stringToMem(p);
                        break;
                    case 'object':
                        if (twrIsFileName(p)) {
                            const r = yield this.fileToMem(p);
                            cparams[ci++] = r[0]; // mem index
                            cparams[ci++] = r[1]; // len
                            break;
                        }
                        else if (p instanceof Uint8Array) {
                            const r = this.uint8ArrayToMem(p);
                            cparams[ci++] = r; // mem index
                            cparams[ci++] = p.length; // len
                            break;
                        }
                    default:
                        throw new Error("executeC: invalid object type passed in");
                }
            }
            // now call the C function
            const f = this.exports[params[0]];
            let cr = f(...cparams);
            return cr;
        });
    }
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    /* utility functions */
    // allocate and copy a string into the webassembly module memory
    stringToMem(sin) {
        let malloc = this.exports.twr_wasm_malloc;
        let strIndex = malloc(sin.length);
        let i;
        for (i = 0; i < sin.length; i++)
            this.mem8[strIndex + i] = sin.charCodeAt(i);
        this.mem8[strIndex + i] = 0;
        return strIndex;
    }
    uint8ArrayToMem(src) {
        let malloc = this.exports.twr_wasm_malloc;
        let dest = malloc(src.length + 1);
        let i;
        for (i = 0; i < src.length; i++)
            this.mem8[dest + i] = src[i];
        return dest;
    }
    fileToMem(fnin) {
        return __awaiter(this, void 0, void 0, function* () {
            let filename;
            if (typeof fnin === 'string')
                filename = fnin;
            else if (typeof fnin === 'object' && twrIsFileName(fnin))
                filename = fnin.twrFileName;
            else
                throw new Error("fileToMem param must be string or twrFileName");
            try {
                let response = yield fetch(filename);
                let buffer = yield response.arrayBuffer();
                let src = new Uint8Array(buffer);
                let dest = this.uint8ArrayToMem(src);
                this.mem8[dest + src.length] = 0; // hack that basic requires.  
                return [dest, src.length + 1];
            }
            catch (err) {
                console.log('fileToMem Error: ' + err + (err.stack ? "\n" + err.stack : ''));
                throw err;
            }
        });
    }
    // get a string out of module memory
    memToString(strIndex) {
        let sout = "";
        let i = 0;
        while (this.mem8[strIndex + i] && (strIndex + i) < this.mem8.length)
            sout = sout + String.fromCharCode(this.mem8[strIndex + i]);
        return sout;
    }
}
//# sourceMappingURL=twrmod.js.map