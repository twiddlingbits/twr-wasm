import { twrLibrary, twrLibraryInstanceRegistry } from "./twrlibrary.js";
// add built-in Libraries (like this one) to twrLibBultins
// libraries use the default export
export default class twrLibMath extends twrLibrary {
    id;
    imports = {
        twrSin: { isCommonCode: true },
        twrCos: { isCommonCode: true },
        twrTan: { isCommonCode: true },
        twrACos: { isCommonCode: true },
        twrASin: { isCommonCode: true },
        twrATan: { isCommonCode: true },
        twrATan2: { isCommonCode: true },
        twrFAbs: { isCommonCode: true },
        twrExp: { isCommonCode: true },
        twrFloor: { isCommonCode: true },
        twrCeil: { isCommonCode: true },
        twrLog: { isCommonCode: true },
        twrSqrt: { isCommonCode: true },
        twrTrunc: { isCommonCode: true },
        twrFMod: { isCommonCode: true },
        twrPow: { isCommonCode: true },
        twrAtod: { isCommonCode: true },
        twrDtoa: { isCommonCode: true },
        twrToFixed: { isCommonCode: true },
        twrToExponential: { isCommonCode: true },
        twrFcvtS: { isCommonCode: true },
    };
    libSourcePath = new URL(import.meta.url).pathname;
    constructor() {
        // all library constructors should start with these two lines
        super();
        this.id = twrLibraryInstanceRegistry.register(this);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    // isCommonCode is set -- this means these functions will be used by twrWasmModuleAsync as well as twrWasmModule
    // This means the functions in twrWasmModuleAsync will not RPC into the JS main thread.
    // isCommonCode can only be used for functions that runs in a Worker thread, and that don't require the async keyword.
    twrSin(callingMod, angle) { return Math.sin(angle); }
    twrCos(callingMod, angle) { return Math.cos(angle); }
    twrTan(callingMod, angle) { return Math.tan(angle); }
    twrACos(callingMod, p) { return Math.acos(p); }
    twrASin(callingMod, p) { return Math.asin(p); }
    twrATan(callingMod, p) { return Math.atan(p); }
    twrATan2(callingMod, y, x) { return Math.atan2(y, x); }
    twrFAbs(callingMod, p) { return Math.abs(p); }
    twrExp(callingMod, p) { return Math.exp(p); }
    twrFloor(callingMod, p) { return Math.floor(p); }
    twrCeil(callingMod, p) { return Math.ceil(p); }
    twrLog(callingMod, p) { return Math.log(p); }
    twrSqrt(callingMod, p) { return Math.sqrt(p); }
    twrTrunc(callingMod, p) { return Math.trunc(p); }
    twrFMod(callingMod, x, y) { return x % y; }
    twrPow(callingMod, x, y) { return Math.pow(x, y); }
    twrAtod(callingMod, ...p) { return this.atod(callingMod.wasmMem, ...p); }
    twrDtoa(callingMod, ...p) { this.dtoa(callingMod.wasmMem, ...p); }
    twrToFixed(callingMod, ...p) { this.toFixed(callingMod.wasmMem, ...p); }
    twrToExponential(callingMod, ...p) { this.toExponential(callingMod.wasmMem, ...p); }
    twrFcvtS(callingMod, ...p) { return this.fcvtS(callingMod.wasmMem, ...p); }
    //////////////////////////////////////////////////////////////////////////////////////
    atod(mem, strptr, len) {
        const str = mem.getString(strptr, len);
        const upper = str.trimStart().toUpperCase();
        if (upper == "INF" || upper == "+INF" || upper == "INFINITY" || upper == "+INFINITY")
            return Number.POSITIVE_INFINITY;
        else if (upper == "-INF" || upper == "-INFINITY")
            return Number.NEGATIVE_INFINITY;
        else {
            // allow D for exponent -- old microsoft format they still support in _fctv and I support in my awbasic
            // parseFloat will handle 'Infinity' and'-Infinity' literal
            // parseFloat appears to be case sensitive when parsing 'Infinity'
            // parseFloat ignores leading whitespace
            // parseFloat() is more lenient than Number() because it ignores trailing invalid characters
            const r = Number.parseFloat(str.replaceAll('D', 'e').replaceAll('d', 'e'));
            return r;
        }
    }
    dtoa(mem, buffer, buffer_size, value, max_precision) {
        if (max_precision == -1) {
            const r = value.toString();
            mem.copyString(buffer, buffer_size, r);
        }
        else {
            let r = value.toString();
            if (r.length > max_precision)
                r = value.toPrecision(max_precision);
            mem.copyString(buffer, buffer_size, r);
        }
    }
    toFixed(mem, buffer, buffer_size, value, decdigits) {
        const r = value.toFixed(decdigits);
        mem.copyString(buffer, buffer_size, r);
    }
    toExponential(mem, buffer, buffer_size, value, decdigits) {
        const r = value.toExponential(decdigits);
        mem.copyString(buffer, buffer_size, r);
    }
    // emulates the MS C lib function _fcvt_s, but doesn't support all ranges of number.
    // Number.toFixed() has a max size of 100 fractional digits,  and values must be less than 1e+21
    // Negative exponents must be now smaller than 1e-99
    // fully-function C version also int he source, but this is the version enabled by default
    fcvtS(mem, buffer, // char *
    sizeInBytes, //size_t
    value, // double
    fracpart_numdigits, //int
    dec, // int *
    sign // int *
    ) {
        if (buffer == 0 || sign == 0 || dec == 0 || sizeInBytes < 1)
            return 1;
        let digits;
        let decpos;
        let s = 0; // default to positive
        if (Number.isNaN(value)) { /* nan */
            digits = "1#QNAN00000000000000000000000000000".slice(0, fracpart_numdigits + 1);
            decpos = 1;
        }
        else if (!Number.isFinite(value)) { /* infinity */
            digits = "1#INF00000000000000000000000000000".slice(0, fracpart_numdigits + 1);
            decpos = 1;
        }
        else if (value == 0) {
            digits = "000000000000000000000000000000000000".slice(0, fracpart_numdigits);
            decpos = 0;
        }
        else {
            if (value < 0) {
                s = 1; // negative
                value = Math.abs(value);
            }
            if (fracpart_numdigits > 100 || value > 1e+21 || value < 1e-99) {
                mem.copyString(buffer, sizeInBytes, "");
                mem.mem32[dec] = 0;
                return 1;
            }
            const roundValStr = value.toFixed(fracpart_numdigits);
            let [intPart = "", fracPart = ""] = roundValStr.split('.');
            if (intPart == "0")
                intPart = "";
            if (intPart.length > 0) { // has integer part
                decpos = intPart.length;
                digits = intPart + fracPart;
            }
            else { // only a fraction
                digits = fracPart.replace(/^0+/, ""); // remove leading zeros
                decpos = digits.length - fracPart.length;
            }
        }
        if (sizeInBytes - 1 < digits.length)
            return 1;
        mem.copyString(buffer, sizeInBytes, digits);
        mem.setLong(dec, decpos);
        mem.setLong(sign, s);
        return 0;
        /*
        this version 'works' with larger numbers than using toFixed, but doesn't round correctly
  
        let decpos=0;
        let digits:string;
        if (value!=0) decpos=Math.floor(Math.log10(value))+1;
  
        if (decpos>0) { // has integer part
           const intlen=Math.max(decpos, 0);
           console.log("intlen=",intlen, "decpos=",decpos);
           const [nonExponent, exponent=0] = value.toPrecision(intlen+fracpart_numdigits).split('e');
           digits=nonExponent.replace('.', '');
           digits=digits.replace(/^0+/,"");  // remove leading zeros
        }
        else { // only a fraction
           const intpart=Math.trunc(value);
           const fracpart=value-intpart;
           const prec=fracpart_numdigits- (-decpos);
           console.log("prec=",prec);
           if (prec<1) {
                 digits="";
           }
           else {
                 const [nonExponent, exponent=0] = fracpart.toPrecision(prec).split('e');
                 digits=nonExponent.replace('.', '');
                 digits=digits.replace(/^0+/,"");
           }
        }
  
        console.log("fcvtS value",value,"fracpart_numdigits",fracpart_numdigits);
        console.log('digits=',digits);
        console.log('dec=',decpos);
        console.log("sign=",s);
     */
    }
}
//# sourceMappingURL=twrlibmath.js.map