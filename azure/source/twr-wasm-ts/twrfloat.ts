
import {twrWasmModuleBase} from "./twrmodbase.js"

export class twrFloatUtil {
    mod: twrWasmModuleBase;

    constructor(mod: twrWasmModuleBase) {
        this.mod=mod;
    }

    atod(strptr:number):number {
        const str=this.mod.getString(strptr);

        const upper=str.trimStart().toUpperCase();
        if (upper=="INF" || upper=="+INF")
            return Number.POSITIVE_INFINITY;
        else if (upper=="-INF")
            return Number.NEGATIVE_INFINITY
        else {
            // allow D for exponent -- old microsoft format they still support in fctv and I support in my awbasic
				// parseFloat is a locale-independent method, meaning that the number must be formatted using a period for the decimal point
            const r=Number.parseFloat(str.replaceAll('D','e').replaceAll('d','e'));
            return r;
        }
    }

    dtoa(buffer:number, buffer_size:number, value:number, max_precision:number):void {
        if (max_precision==-1) {
            const r=value.toString();
            this.mod.copyString(buffer, buffer_size, r);
        }
        else {
            let r=value.toString();
            if (r.length>max_precision)
                r=value.toPrecision(max_precision);
            this.mod.copyString(buffer, buffer_size, r);
        }
    }

    toFixed(buffer:number, buffer_size:number, value:number, decdigits:number):void {
        const r=value.toFixed(decdigits);
        this.mod.copyString(buffer, buffer_size, r);
    }

    toExponential(buffer:number, buffer_size:number, value:number, decdigits:number):void {
        const r=value.toExponential(decdigits);
        this.mod.copyString(buffer, buffer_size, r);
    }

    // emulates the C lib function -fcvt_s, but doesn't support all ranges of number.
    // Number.toFixed() has a max size of 100 fractional digits,  and values must be less than 1e+21
    // Negative exponents must be now smaller than 1e-99
    // fully-function C version also int he source, but this is the version enabled by default
    fcvtS(
        buffer:number,  // char *
        sizeInBytes:number, //size_t
        value:number,  // double
        fracpart_numdigits:number,  //int
        dec:number,  // int *
        sign:number  // int *
     ):number {

        if (buffer==0 ||sign==0 || dec==0 || sizeInBytes<1) return 1;

        let digits:string;
        let decpos:number;
        let s=0; // default to positive


        if (Number.isNaN(value))  { /* nan */
            digits="1#QNAN00000000000000000000000000000".slice(0, fracpart_numdigits+1);
            decpos=1;
        }
        else if (!Number.isFinite(value)) {    /* infinity */
            digits="1#INF00000000000000000000000000000".slice(0, fracpart_numdigits+1);
            decpos=1;
        }
        else if (value==0) {  
            digits="000000000000000000000000000000000000".slice(0,fracpart_numdigits);
            decpos=0;
        }
        
        else {

            if (value<0) {
                s=1;  // negative
                value=Math.abs(value);
            }

            if (fracpart_numdigits>100 || value > 1e+21 || value < 1e-99) {  
                this.mod.copyString(buffer, sizeInBytes, "");
                this.mod.mem32[dec]=0;
                return 1;
            }

            const roundValStr=value.toFixed(fracpart_numdigits);
            let [intPart="", fracPart=""] = roundValStr.split('.');
            if (intPart=="0") intPart="";

            if (intPart.length>0) { // has integer part
                decpos=intPart.length;
                digits=intPart+fracPart;
            }
            else { // only a fraction
                digits=fracPart.replace(/^0+/,"");  // remove leading zeros
                decpos=digits.length-fracPart.length;
            }
        }

        if (sizeInBytes-1 < digits.length) return 1; 
        this.mod.copyString(buffer, sizeInBytes, digits);
        this.mod.setLong(dec, decpos);
        this.mod.setLong(sign, s);

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