import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrTimeEpochImpl } from "./twrdate.js";
import { twrTimeTmLocalImpl, twrUserLconvImpl, twrUserLanguageImpl, twrRegExpTest1252Impl, twrToLower1252Impl, twrToUpper1252Impl } from "./twrlocale.js";
import { twrStrcollImpl, twrUnicodeCodePointToCodePageImpl, twrCodePageToUnicodeCodePoint, twrGetDtnamesImpl } from "./twrlocale.js";
import { twrConsoleRegistry } from "./twrconreg.js";
export class twrWasmModule extends twrWasmModuleInJSMain {
    malloc;
    imports;
    cpTranslate;
    constructor(opts = {}) {
        super(opts);
        this.malloc = (size) => { throw new Error("error - un-init malloc called"); };
        this.cpTranslate = new twrCodePageToUnicodeCodePoint();
        const canvasErrorFunc = (...args) => {
            throw new Error("A 2D draw function was called, but a valid twrCanvas is not defined.");
        };
        const conCall = (funcName, jsid, ...args) => {
            const con = twrConsoleRegistry.getConsole(jsid);
            const f = con[funcName];
            if (!f)
                throw new Error(`Likely using an incorrect console type. jsid=${jsid}, funcName=${funcName}`);
            return f.call(con, ...args);
        };
        const conSetRange = (jsid, chars, start, len) => {
            let values = [];
            for (let i = start; i < start + len; i++) {
                values.push(this.getLong(i));
            }
            conCall("setRange", jsid, start, values);
        };
        const conPutStr = (jsid, chars, codePage) => {
            conCall("putStr", jsid, this.getString(chars), codePage);
        };
        const conGetProp = (jsid, pn) => {
            const propName = this.getString(pn);
            return conCall("getProp", jsid, propName);
        };
        const conDrawSeq = (jsid, ds) => {
            conCall("drawSeq", jsid, ds, this);
        };
        const twrGetConIDFromNameImpl = (nameIdx) => {
            const name = this.getString(nameIdx);
            const id = this.ioNamesToID[name];
            if (id)
                return id;
            else
                return -1;
        };
        this.imports = {
            twrTimeEpoch: twrTimeEpochImpl,
            twrTimeTmLocal: twrTimeTmLocalImpl.bind(this),
            twrUserLconv: twrUserLconvImpl.bind(this),
            twrUserLanguage: twrUserLanguageImpl.bind(this),
            twrRegExpTest1252: twrRegExpTest1252Impl.bind(this),
            twrToLower1252: twrToLower1252Impl.bind(this),
            twrToUpper1252: twrToUpper1252Impl.bind(this),
            twrStrcoll: twrStrcollImpl.bind(this),
            twrUnicodeCodePointToCodePage: twrUnicodeCodePointToCodePageImpl.bind(this),
            twrCodePageToUnicodeCodePoint: this.cpTranslate.convert.bind(this.cpTranslate),
            twrGetDtnames: twrGetDtnamesImpl.bind(this),
            twrGetConIDFromName: twrGetConIDFromNameImpl,
            twrConCharOut: conCall.bind(null, "charOut"),
            twrConCharIn: this.null,
            twrSetFocus: this.null,
            twrConGetProp: conGetProp,
            twrConCls: conCall.bind(null, "cls"),
            twrConSetC32: conCall.bind(null, "setC32"),
            twrConSetReset: conCall.bind(null, "setReset"),
            twrConPoint: conCall.bind(null, "point"),
            twrConSetCursor: conCall.bind(null, "setCursor"),
            twrConSetColors: conCall.bind(null, "setColors"),
            twrConSetRange: conSetRange,
            twrConPutStr: conPutStr,
            twrConDrawSeq: conDrawSeq,
            twrCanvasCharIn: this.null,
            twrCanvasInkey: this.null,
            twrSleep: this.null,
            twrSin: Math.sin,
            twrCos: Math.cos,
            twrTan: Math.tan,
            twrFAbs: Math.abs,
            twrACos: Math.acos,
            twrASin: Math.asin,
            twrATan: Math.atan,
            twrExp: Math.exp,
            twrFloor: Math.floor,
            twrCeil: Math.ceil,
            twrFMod: function (x, y) { return x % y; },
            twrLog: Math.log,
            twrPow: Math.pow,
            twrSqrt: Math.sqrt,
            twrTrunc: Math.trunc,
            twrDtoa: this.floatUtil.dtoa.bind(this.floatUtil),
            twrToFixed: this.floatUtil.toFixed.bind(this.floatUtil),
            twrToExponential: this.floatUtil.toExponential.bind(this.floatUtil),
            twrAtod: this.floatUtil.atod.bind(this.floatUtil),
            twrFcvtS: this.floatUtil.fcvtS.bind(this.floatUtil),
        };
    }
    async loadWasm(pathToLoad) {
        return super.loadWasm(pathToLoad, this.imports, this.ioNamesToID);
    }
    null(inval) {
        throw new Error("call to unimplemented twrXXX import in twrWasmModule.  Use twrWasmModuleAsync ?");
    }
}
//# sourceMappingURL=twrmod.js.map