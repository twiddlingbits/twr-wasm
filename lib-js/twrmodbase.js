var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/*********************************************************************/
/*********************************************************************/
/*********************************************************************/
export class twrWasmModuleBase {
    constructor() {
    }
    /*********************************************************************/
    /*********************************************************************/
    loadWasm(fileToLoad) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield fetch(fileToLoad);
                if (!response.ok)
                    throw new Error(response.statusText);
                let wasmBytes = yield response.arrayBuffer();
                let allimports = Object.assign({ memory: this.memory }, this.modParams.imports);
                let instance = yield WebAssembly.instantiate(wasmBytes, { env: allimports });
                this.exports = instance.instance.exports;
                this.malloc = (size) => {
                    return new Promise(resolve => {
                        const m = this.exports.twr_malloc;
                        resolve(m(size));
                    });
                };
                this.init();
            }
            catch (err) {
                console.log('WASM instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
                throw err;
            }
        });
    }
    init() {
        let p;
        switch (this.modParams.stdio) {
            case "debug":
                p = 0;
                break;
            case "div":
                p = 1;
                break;
            case "canvas":
                p = 2;
                break;
            case "null":
                p = 3;
                break;
            default:
                p = 0; // debug
        }
        const init = this.exports.twr_wasm_init;
        init(p);
    }
    /* executeC takes an array where:
    * the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
    * and the next entries are a variable number of parameters to pass to the C function, of type
    * number - converted to int32 or float64 as appropriate
    * string - converted to a an index (ptr) into a module Memory returned via stringToMem()
    * URL - the file contents are loaded into module Memory via urlToMem(), and two C parameters are generated - index (pointer) to the memory, and length
    * Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length
    */
    executeC(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const cparams = yield this.convertParams(params);
            return this.executeCImpl(params[0], cparams);
        });
    }
    executeCImpl(fname, cparams = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.exports)
                throw new Error("this.exports undefined");
            if (!this.exports[fname])
                throw new Error("executeC: function '" + fname + "' not in export table");
            const f = this.exports[fname];
            let cr = f(...cparams);
            return cr;
        });
    }
    // convert an array of parameters to numbers by stuffing contents into wasm
    convertParams(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(params.constructor === Array))
                throw new Error("executeC: params must be array, first arg is function name");
            if (params.length == 0)
                throw new Error("executeC: missing function name");
            let cparams = [];
            let ci = 0;
            for (let i = 1; i < params.length; i++) {
                const p = params[i];
                switch (typeof p) {
                    case 'number':
                        cparams[ci++] = p;
                        break;
                    case 'string':
                        cparams[ci++] = yield this.putString(p);
                        break;
                    case 'object':
                        if (p instanceof URL) {
                            const r = yield this.fetchAndPutURL(p);
                            cparams[ci++] = r[0]; // mem index
                            cparams[ci++] = r[1]; // len
                            break;
                        }
                        else if (p instanceof Uint8Array) {
                            const r = yield this.putU8(p);
                            cparams[ci++] = r; // mem index
                            cparams[ci++] = p.length; // len
                            break;
                        }
                    default:
                        throw new Error("executeC: invalid object type passed in");
                }
            }
            return cparams;
        });
    }
    /*********************************************************************/
    /*********************************************************************/
    // allocate and copy a string into the webassembly module memory
    putString(sin) {
        return __awaiter(this, void 0, void 0, function* () {
            let strIndex = yield this.malloc(sin.length);
            let i;
            for (i = 0; i < sin.length; i++)
                this.mem8[strIndex + i] = sin.charCodeAt(i);
            this.mem8[strIndex + i] = 0;
            return strIndex;
        });
    }
    putU8(src) {
        return __awaiter(this, void 0, void 0, function* () {
            let dest = yield this.malloc(src.length + 1); // +1 is hack that basic requires, on my to fix list
            let i;
            for (i = 0; i < src.length; i++)
                this.mem8[dest + i] = src[i];
            return dest;
        });
    }
    // given a url, load its contents, and stuff into wasm memory similar to Unint8Array
    fetchAndPutURL(fnin) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(typeof fnin === 'object' && fnin instanceof URL))
                throw new Error("fetchAndPutURL param must be URL");
            try {
                let response = yield fetch(fnin);
                let buffer = yield response.arrayBuffer();
                let src = new Uint8Array(buffer);
                let dest = yield this.putU8(src);
                this.mem8[dest + src.length] = 0; // hack that basic requires.  
                return [dest, src.length + 1];
            }
            catch (err) {
                console.log('fetchAndPutURL Error: ' + err + (err.stack ? "\n" + err.stack : ''));
                throw err;
            }
        });
    }
    getLong(idx) {
        if (idx < 0 || idx >= this.mem8.length)
            throw new Error("invalid index passed to getLong: " + idx);
        const long = this.mem8[idx] + this.mem8[idx + 1] * 256 + this.mem8[idx + 2] * 256 * 256 + this.mem8[idx + 3] * 256 * 256 * 256;
        return long;
    }
    getShort(idx) {
        if (idx < 0 || idx >= this.mem8.length)
            throw new Error("invalid index passed to getShort: " + idx);
        const short = this.mem8[idx] + this.mem8[idx + 1] * 256;
        return short;
    }
    // get a string out of module memory
    // null terminated, up until max of (optional) len
    getString(strIndex, len) {
        let sout = "";
        let i = 0;
        while (this.mem8[strIndex + i] && (len === undefined ? true : i < len) && (strIndex + i) < this.mem8.length) {
            sout = sout + String.fromCharCode(this.mem8[strIndex + i]);
            i++;
        }
        return sout;
    }
    // get a byte array out of module memory when passed in index to [size, dataptr]
    getU8Arr(idx) {
        if (idx < 0 || idx >= this.mem8.length)
            throw new Error("invalid index passed to getU8: " + idx);
        const rv = new Uint32Array((this.mem8.slice(idx, idx + 8)).buffer);
        let size = rv[0];
        let dataptr = rv[1];
        if (dataptr < 0 || dataptr >= (this.mem8.length))
            throw new Error("invalid idx.dataptr passed to getU8");
        if (size < 0 || size > (this.mem8.length - dataptr))
            throw new Error("invalid idx.size passed to  getU8");
        const u8 = this.mem8.slice(dataptr, dataptr + size);
        return u8;
    }
    // get a int32 array out of module memory when passed in index to [size, dataptr]
    getU32Arr(idx) {
        if (idx < 0 || idx >= this.mem8.length)
            throw new Error("invalid index passed to getU32: " + idx);
        const rv = new Uint32Array((this.mem8.slice(idx, idx + 8)).buffer);
        let size = rv[0];
        let dataptr = rv[1];
        if (dataptr < 0 || dataptr >= (this.mem8.length))
            throw new Error("invalid idx.dataptr passed to getU32");
        if (size < 0 || size > (this.mem8.length - dataptr))
            throw new Error("invalid idx.size passed to  getU32");
        if (size % 4 != 0)
            throw new Error("idx.size is not an integer number of 32 bit words");
        const u32 = new Uint32Array((this.mem8.slice(dataptr, dataptr + size)).buffer);
        return u32;
    }
}
//# sourceMappingURL=twrmodbase.js.map