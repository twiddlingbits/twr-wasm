
import { IWasmMemoryBase } from "./twrwasmmem";

export class twrFloatUtil {
   // must be set before making calls.  
   // handled this way because object instance needs to be create before mem is available
   mem?: IWasmMemoryBase;  

    atod(strptr:number, len:number):number {
        const str=this.mem!.getString(strptr, len);

        const upper=str.trimStart().toUpperCase();
        if (upper=="INF" || upper=="+INF" || upper=="INFINITY" || upper=="+INFINITY")
            return Number.POSITIVE_INFINITY;
        else if (upper=="-INF" || upper=="-INFINITY")
            return Number.NEGATIVE_INFINITY
        else {
            // allow D for exponent -- old microsoft format they still support in _fctv and I support in my awbasic
				// parseFloat will handle 'Infinity' and'-Infinity' literal
				// parseFloat appears to be case sensitive when parsing 'Infinity'
				// parseFloat ignores leading whitespace
				// parseFloat() is more lenient than Number() because it ignores trailing invalid characters
            const r=Number.parseFloat(str.replaceAll('D','e').replaceAll('d','e'));
            return r;
        }
    }

    dtoa(buffer:number, buffer_size:number, value:number, max_precision:number):void {
        if (max_precision==-1) {
            const r=value.toString();
            this.mem!.copyString(buffer, buffer_size, r);
        }
        else {
            let r=value.toString();
            if (r.length>max_precision)
                r=value.toPrecision(max_precision);
            this.mem!.copyString(buffer, buffer_size, r);
        }
    }

    toFixed(buffer:number, buffer_size:number, value:number, decdigits:number):void {
        const r=value.toFixed(decdigits);
        this.mem!.copyString(buffer, buffer_size, r);
    }

    toExponential(buffer:number, buffer_size:number, value:number, decdigits:number):void {
        const r=value.toExponential(decdigits);
        this.mem!.copyString(buffer, buffer_size, r);
    }

    // emulates the MS C lib function _fcvt_s, but doesn't support all ranges of number.
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
                this.mem!.copyString(buffer, sizeInBytes, "");
                this.mem!.mem32[dec]=0;
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
        this.mem!.copyString(buffer, sizeInBytes, digits);
        this.mem!.setLong(dec, decpos);
        this.mem!.setLong(sign, s);

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