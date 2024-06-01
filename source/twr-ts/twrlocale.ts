import {twrWasmModuleBase} from "./twrmodbase.js"


// these match C #defines in locale.h
export const codePageASCII=0;
export const codePage1252=1252;
export const codePageUTF8=65001;
export const codePageUTF32=12000;

const decoderUTF8 = new TextDecoder('utf-8');
const decoder1252 = new TextDecoder('windows-1252');


export function twrCodePageToUnicodeCodePointImpl(c:number, codePage:number) {
	let outstr:string;
	if (codePage==codePageUTF8) {
		outstr=decoderUTF8.decode(new Uint8Array([c]), {stream: true});
	}
	else if (codePage==codePage1252) {
		outstr = decoder1252.decode(new Uint8Array([c]));
	}
	else if (codePage==codePageASCII) {
		if (c>127) outstr="";
		else outstr=String.fromCharCode(c);
	}
	else if (codePage==codePageUTF32) {
		outstr=String.fromCodePoint(c);
	}
	else {
		throw new Error("unsupported CodePage: "+codePage)
	}

	return outstr.codePointAt(0) || 0;
}

export function twrUnicodeCodePointToCodePageImpl(this: twrWasmModuleBase, outstr:number, cp:number, codePage:number) {
	noasyncCopyString(this, outstr, String.fromCharCode(cp), codePage);
}

export function twrUserLanguageImpl(this: twrWasmModuleBase) {

	return noasyncPutString(this, navigator.language, codePageASCII);

}

// checks if the character c, when converted to a string, is matched by the passed in regexp string 
// utf-8 version not needed since this function is used for a single byte ('char'), 
// and non-ascii range utf-8 single byte are not valid
export function twrRegExpTest1252Impl(this: twrWasmModuleBase, regexpStrIdx:number, c:number) {

	const regexpStr=this.getString(regexpStrIdx);
	const regexp=new RegExp(regexpStr, 'u');
	const cstr:string = decoder1252.decode(new Uint8Array([c]));
	const r=regexp.test(cstr);
	if (r) return 1; else return 0;

}

export function to1252(instr:string) {

	if (instr.codePointAt(0)==8239) return 32;  // turn narrow-no-break-space into space

	switch (instr) {
	   case '€': return 0x80;
	   case '‚': return 0x82;
	   case 'ƒ': return 0x83;
	   case '„': return 0x84;
	   case '…': return 0x85;
	   case '†': return 0x86;
	   case '‡': return 0x87;
	   case 'ˆ': return 0x88;
	   case '‰': return 0x89;
	   case 'Š': return 0x8A; 
		case '‹': return 0x8B;
	   case 'Œ': return 0x8C;
	   case 'Ž': return 0x8E;
	   case '‘': return 0x91;
	   case '’': return 0x92;
	   case '“': return 0x93;
	   case '”': return 0x94;
	   case '•': return 0x95;
	   case '–': return 0x96;
	   case '—': return 0x97;
	   case '˜': return 0x98;
	   case '™': return 0x99;
	   case 'š': return 0x9A;
	   case '›': return 0x9B;
	   case 'œ': return 0x9C;
	   case 'ž': return 0x9E;
	   case 'Ÿ': return 0x9F;
	}
	
	let cp=instr.codePointAt(0) || 0;
	if (cp>255)
		 cp=0;
	return cp;
}

export function toASCII(instr:string) {
	if (instr=='ƒ') return 102; // lowercase 'f'
	if (instr.codePointAt(0)==8239) return 32;  // turn narrow-no-break-space into space

	let cp=instr.codePointAt(0) || 0;
	if (cp>127) return 120; // lowercase 'x'
	return cp;
}

//utf-8 version not needed since this function is used for a single byte ('char'), 
// and non-ascii range utf-8 single byte are not valid
export function twrToLower1252Impl(this: twrWasmModuleBase, c:number) {

	const cstr:string = decoder1252.decode(new Uint8Array([c]));
	const regexp=new RegExp("^\\p{Letter}$", 'u');
	if (regexp.test(cstr)) {
		return to1252(cstr.toLocaleLowerCase());
	}
	else {
		return c;
	}

}

//utf-8 version not needed since this function is used for a single byte ('char'), 
// and non-ascii range utf-8 single byte are not valid
export function twrToUpper1252Impl(this: twrWasmModuleBase, c:number) {

	const cstr:string = decoder1252.decode(new Uint8Array([c]));
	if (cstr=="µ") return c;  // upper case version doesn't fit in 1252
	if (cstr=='ƒ') return c;  // upper case version doesn't fit in 1252
	if (cstr=='ß') return c;  // toLocaleUpperCase() will convert beta to SS
	const regexp=new RegExp("^\\p{Letter}$", 'u');
	if (regexp.test(cstr)) {
		return to1252(cstr.toLocaleUpperCase());
	}
	else {
		return c;
	}

}

export function twrStrcollImpl(this: twrWasmModuleBase, lhs:number, rhs:number, codePage:number) {
	const lhStr=this.getString(lhs, undefined, codePage);
	const rhStr=this.getString(rhs, undefined, codePage);

	// c strcmp(): A positive integer if str1 is greater than str2.
	// 1 if string 1 (lh) comes after string 2 (rh)
	const collator = new Intl.Collator();
	const r = collator.compare(lhStr, rhStr);

	return r;
}

//struct tm {
//	int	tm_sec;		/* seconds after the minute [0-60] */
//	int	tm_min;		/* minutes after the hour [0-59] */
//	int	tm_hour;		/* hours since midnight [0-23] */
//	int	tm_mday;		/* day of the month [1-31] */
//	int	tm_mon;		/* months since January [0-11] */
//	int	tm_year;		/* years since 1900 */
//	int	tm_wday;		/* days since Sunday [0-6] */
//	int	tm_yday;		/* days since January 1 [0-365] */
//	int	tm_isdst;	/* Daylight Saving Time flag */
//	long	tm_gmtoff;	/* offset from UTC in seconds */
//	char	*tm_zone;	/* timezone abbreviation */
//};

// fill in struct tm
// epcohSecs as 32bit int will overflow January 19, 2038. 
export function twrTimeTmLocalImpl(this: twrWasmModuleBase, tmIdx:number, epochSecs:number) {

	const d=new Date(epochSecs*1000);
	this.setLong(tmIdx, d.getSeconds());
	this.setLong(tmIdx+4, d.getMinutes());
	this.setLong(tmIdx+8, d.getHours());
	this.setLong(tmIdx+12, d.getDate());
	this.setLong(tmIdx+16, d.getMonth());
	this.setLong(tmIdx+20, d.getFullYear()-1900);
	this.setLong(tmIdx+24, d.getDay());
	this.setLong(tmIdx+28, getDayOfYear(d));
	this.setLong(tmIdx+32, isDst());
	this.setLong(tmIdx+36, 	-d.getTimezoneOffset()*60);
	this.setLong(tmIdx+40, 	noasyncPutString(this, getTZ(d), codePageASCII)); 

}

//struct lconv {
//	char	*decimal_point;   		0
//	char	*thousands_sep;			4
//	char	*grouping;					8
//	char	*int_curr_symbol;			12
//	char	*currency_symbol;			16
//	char	*mon_decimal_point;		20
//	char	*mon_thousands_sep;		24
//	char	*mon_grouping;				28
//	char	*positive_sign;			32
//	char	*negative_sign;			36
//	char	int_frac_digits;			40
//	char	frac_digits;				44
//	char	p_cs_precedes;				48
//	char	p_sep_by_space;			52
//	char	n_cs_precedes;				56
//	char	n_sep_by_space;			60
//	char	p_sign_posn;				64
//	char	n_sign_posn;				68
//};

export function twrUserLconvImpl(this: twrWasmModuleBase, lconvIdx:number, codePage:number) {
	const locDec=getLocaleDecimalPoint();
	const locSep=getLocaleThousandsSeparator();
	setAndPutString(this, lconvIdx+0, locDec, codePage);
	setAndPutString(this, lconvIdx+4, locSep, codePage);
	setAndPutString(this, lconvIdx+20, locDec, codePage);
	setAndPutString(this, lconvIdx+24, locSep, codePage);
	setAndPutString(this, lconvIdx+24, locSep, codePage);
	setAndPutString(this, lconvIdx+24, locSep, codePage);
	setAndPutString(this, lconvIdx+32, "+", codePage);
	setAndPutString(this, lconvIdx+36, "-", codePage);
	setAndPutString(this, lconvIdx+12, getLocalCurrencySymbol(), codePage);
	setAndPutString(this, lconvIdx+16, getLocalCurrencySymbol(), codePage);
}

function setAndPutString(mod: twrWasmModuleBase, idx:number, sin:string,  codePage:number) {
	const stridx=noasyncPutString(mod, sin, codePage);
	mod.setLong(idx, stridx);
}

// JS string into the webassembly module memory.  Does not verify outbuf length. Encode the wasm string using codePage
function noasyncCopyString(mod: twrWasmModuleBase, outbuf:number, sin:string,  codePage:number) {
		const ru8=mod.stringToU8(sin, codePage);
		mod.mem8.set(ru8, outbuf);
		mod.mem8[outbuf+ru8.length]=0;
}

// allocate and copy a JS string into the webassembly module memory, encode the wasm string using codePage
function noasyncPutString(mod: twrWasmModuleBase, sin:string,  codePage:number) {
	const ru8=mod.stringToU8(sin, codePage);
	const malloc=mod.exports!.malloc as (size:number)=>number;
	const strIndex:number=malloc(ru8.length+1);
	mod.mem8.set(ru8, strIndex);
	mod.mem8[strIndex+ru8.length]=0;

	return strIndex;
}

function getDayOfYear(date:Date) {
	const start = new Date(date.getFullYear(), 0, 1); 
	const diff = date.getTime() - start.getTime(); // Difference in milliseconds
	const oneDay = 1000 * 60 * 60 * 24; // Number of milliseconds in one day
	const day = Math.floor(diff / oneDay);
	return day;
}

function isDst() {
	const timeString = new Date().toLocaleTimeString('en-US', { timeZoneName: 'long' });
	if (timeString.includes('Daylight')) {
		return 1;
	} else {
		return 0;
	}
}

function getTZ(date:Date) {
	const timeZone = date.toLocaleTimeString('en-US', {timeZoneName: 'short'}).split(' ').pop();
	return timeZone?timeZone:"UTC";
}

function getLocaleDecimalPoint() {
    const formatter = new Intl.NumberFormat();

	 //console.log("dec resolvedOptions", formatter.resolvedOptions());

    // Format a test number to find out the decimal point.
    const formattedNumber = formatter.format(1.1);
	 //console.log("dec formattedNumber", formattedNumber);

    // Find the character between the numeric parts.
    const decimalPoint = formattedNumber.replace(/[0-9]/g, '').charAt(0);

    return decimalPoint;
}

function getLocaleThousandsSeparator() {
	const formatter = new Intl.NumberFormat(undefined, {
		 minimumFractionDigits: 0  // Ensure no decimal part interferes
	});

	// Format a test number to include a thousands separator.
	const formattedNumber = formatter.format(1000);
	//console.log("sep formattedNumber", formattedNumber);

	// Extract the thousands separator by removing numeric characters and possible decimal points.
	// This may need adjustment depending on whether other characters are present.
	let thousandsSeparator = formattedNumber.replace(/[0-9]/g, '').charAt(0);  // Assumes separator is the first character.
	//console.log("sep code",  thousandsSeparator.codePointAt(0));
	return thousandsSeparator;
}

// this doesn't work, localeCurrency is not correct
function getLocaleCurrencyDecimalPoint() {
	// Create an initial NumberFormat object to detect the locale's currency
	const tempFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
	const localeCurrency = tempFormatter.resolvedOptions().currency;
	const formatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: localeCurrency
  });
	// Format a test number to find out the decimal point.
	const formattedNumber = formatter.format(1.1);

	// Find the character between the numeric parts.
	// char(0) is the currency symbol
	const decimalPoint = formattedNumber.replace(/[0-9]/g, '').charAt(1);

	return decimalPoint;
}

function getLocalCurrencySymbol() {
	switch (navigator.language) {
		case "en-US":
		case "en-CA":
		case "fr-CA":
		case "en-AU":
		case "es-MX":
		case "es-AR":
		case "es-CL":
		case "es-CO":
		case "es-EC":
		case "en-GY":
		case "nl-SR":
		case "es-UY":
		case "en-BZ":
		case "es-SV":
		case "es-PA":
			return "$";

		case "es-BO":
		case "es-VE":
			return "Bs.";

		case "es-PY":
			return "₲";

		case "es-PE":
			return "S/";

		case "es-CR":
			return "₡";

		case "es-GT":
			return "Q";		
				
		case "es-HN":
			return "L";
			
		case "es-NI":
			return "C$";

		case "en-GB":
			return "£"

		case "en-IE":
		case "de-DE":
		case "fr-FR":
		case "de-AT":
		case "nl-BE":
		case "fr-BE":
		case "el-CY":
		case "et-EE":
		case "fi-FI":
		case "sv-FI":
		case "el-GR":
		case "it-IT":
		case "lv-LV":
		case "lt-LT":
		case "fr-LU":
		case "de-LU":
		case "lb-LU":
		case "mt-MT":
		case "nl-NL":
		case "pt-PT":
		case "sk-SK":
		case "sl-SI":
		case "es-ES":
			return "€"

		case "ja-JP":
			return "¥"

		case "zh-CN":
			return "¥"

		case "de-CH":
		case "fr-CH":
		case "it-CH":
			return "CHF"

		case "sv-SE":
		case "da-DK":
		case "nb-NO":
			return "kr"

		case "ru-RU":
			return "₽"

		case "ko-KR":
			return "₩"

		case "en-IN":
			return "₹"

		case "pt-BR":
		return "R$"

		case "he-IL":
		return "₪"

		case "tr-TR":
		return "₺"

		default:
			return "";
	}
}