import {twrLibrary, TLibImports, twrLibraryInstanceRegistry} from "./twrlibrary.js";
import {IWasmMemory} from "./twrwasmmem.js";
import {IWasmModule} from "./twrmod.js"
import {twrWasmBase} from "./twrwasmbase.js"

///////////////////////////////////////////////////////////////////////////////////////

// these match C #defines in locale.h
export const codePageASCII=0;
export const codePage1252=1252;
export const codePageUTF8=65001;
export const codePageUTF32=12000;

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

export default class twrLibLocale extends twrLibrary {
   id:number;
   imports:TLibImports = {
      twrUnicodeCodePointToCodePage:{isCommonCode: true},
      twrCodePageToUnicodeCodePoint:{isCommonCode: true},
      twrUserLanguage:{isCommonCode: true},
      twrTimeTmLocal:{isCommonCode: true},
      twrUserLconv:{isCommonCode: true},
      twrRegExpTest1252:{isCommonCode: true},
      twrToUpper1252:{isCommonCode: true},
      twrToLower1252:{isCommonCode: true},
      twrStrcoll:{isCommonCode: true},
      twrGetDtnames:{isCommonCode: true},
   }

   libSourcePath = new URL(import.meta.url).pathname;

   cpTranslate = new twrCodePageToUnicodeCodePoint();
   cpTranslate2 = new twrCodePageToUnicodeCodePoint();

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   ///////////////////////////////////////////////////////////////////////////////////////

   twrCodePageToUnicodeCodePoint(callingMod:IWasmModule|twrWasmBase, c:number, codePage:number) {
      return this.cpTranslate2.convert(c, codePage);
   }
   
   twrUnicodeCodePointToCodePage(callingMod:IWasmModule|twrWasmBase, outstr:number, cp:number, codePage:number) {
      const ru8=callingMod.wasmMem.stringToU8(String.fromCodePoint(cp), codePage);
      callingMod.wasmMem.mem8u.set(ru8, outstr);
      return ru8.length;
   }

   twrUserLanguage(callingMod:IWasmModule|twrWasmBase,) {
      // navigator.language works in JS main thread and Worker thread
      return callingMod.wasmMem.putString(navigator.language, codePageASCII);

   }

   // checks if the character c, when converted to a string, is matched by the passed in regexp string 
   // utf-8 version not needed since this function is used for a single byte ('char'), 
   // and non-ascii range utf-8 single byte are not valid
   twrRegExpTest1252(callingMod:IWasmModule|twrWasmBase, regexpStrIdx:number, c:number) {

      const regexpStr=callingMod.wasmMem.getString(regexpStrIdx);
      const regexp=new RegExp(regexpStr, 'u');
      const cstr:string = this.cpTranslate.decoder1252.decode(new Uint8Array([c]));
      const r=regexp.test(cstr);
      if (r) return 1; else return 0;

   }

   // utf-8 version not needed since this function is used for a single byte ('char'), 
   // and non-ascii range utf-8 single byte are not valid
   twrToLower1252(callingMod:IWasmModule|twrWasmBase, c:number) {

      const cstr:string = this.cpTranslate.decoder1252.decode(new Uint8Array([c]));
      const regexp=new RegExp("^\\p{Letter}$", 'u');
      if (regexp.test(cstr)) {
         const r = to1252(cstr.toLocaleLowerCase());
         //console.log("twrToLower1252Impl: isLetter", c, cstr, cstr.codePointAt(0), cstr.toLocaleLowerCase(), cstr.toLocaleLowerCase().codePointAt(0), r);
         return r;
      }
      else {
         //console.log("twrToLower1252Impl: isNOTLetter", c, cstr, cstr.codePointAt(0));
         return c;
      }

   }

   //utf-8 version not needed since this function is used for a single byte ('char'), 
   // and non-ascii range utf-8 single byte are not valid
   twrToUpper1252(callingMod:IWasmModule|twrWasmBase, c:number) {

      const cstr:string = this.cpTranslate.decoder1252.decode(new Uint8Array([c]));

      if (cstr.codePointAt(0)==402) return c;  // appears to be safari Version 15.6.1 (17613.3.9.1.16) bug -- this is ƒ
      if (cstr.codePointAt(0)==181) return c;  // appears to be safari Version 15.6.1 (17613.3.9.1.16) bug -- this is µ
      if (cstr.codePointAt(0)==223) return c;  // appears to be safari Version 15.6.1 (17613.3.9.1.16) bug -- this is ß'
      
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

   twrStrcoll(callingMod:IWasmModule|twrWasmBase, lhs:number, rhs:number, codePage:number) {
      const lhStr=callingMod.wasmMem.getString(lhs, undefined, codePage);
      const rhStr=callingMod.wasmMem.getString(rhs, undefined, codePage);

      // c strcmp(): A positive integer if str1 is greater than str2.
      // 1 if string 1 (lh) comes after string 2 (rh)
      const collator = new Intl.Collator();
      const r = collator.compare(lhStr, rhStr);

      return r;
   }

   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////

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
   twrTimeTmLocal(callingMod:IWasmModule|twrWasmBase, tmIdx:number, epochSecs:number) {

      const d=new Date(epochSecs*1000);
      callingMod.wasmMem.setLong(tmIdx, d.getSeconds());
      callingMod.wasmMem.setLong(tmIdx+4, d.getMinutes());
      callingMod.wasmMem.setLong(tmIdx+8, d.getHours());
      callingMod.wasmMem.setLong(tmIdx+12, d.getDate());
      callingMod.wasmMem.setLong(tmIdx+16, d.getMonth());
      callingMod.wasmMem.setLong(tmIdx+20, d.getFullYear()-1900);
      callingMod.wasmMem.setLong(tmIdx+24, d.getDay());
      callingMod.wasmMem.setLong(tmIdx+28, this.getDayOfYear(d));
      callingMod.wasmMem.setLong(tmIdx+32, this.isDst());
      callingMod.wasmMem.setLong(tmIdx+36, 	-d.getTimezoneOffset()*60);
      callingMod.wasmMem.setLong(tmIdx+40, 	callingMod.wasmMem.putString(this.getTZ(d), codePageASCII)); 

   }

   private getDayOfYear(date:Date) {
      const start = new Date(date.getFullYear(), 0, 1); 
      const diff = date.getTime() - start.getTime(); // Difference in milliseconds
      const oneDay = 1000 * 60 * 60 * 24; // Number of milliseconds in one day
      const day = Math.floor(diff / oneDay);
      return day;
   }

   private isDst() {
      const timeString = new Date().toLocaleTimeString('en-US', { timeZoneName: 'long' });
      if (timeString.includes('Daylight')) {
         return 1;
      } else {
         return 0;
      }
   }

   private  getTZ(date:Date) {
      const timeZone = date.toLocaleTimeString('en-US', {timeZoneName: 'short'}).split(' ').pop();
      return timeZone?timeZone:"UTC";
   }

   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////

   private setAndPutString(mem: IWasmMemory, idx:number, sin:string,  codePage:number) {
      const stridx=mem.putString(sin, codePage);
      mem.setLong(idx, stridx);
   }

   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////

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

   twrUserLconv(callingMod:IWasmModule|twrWasmBase, lconvIdx:number, codePage:number) {
      const locDec=this.getLocaleDecimalPoint();
      const locSep=this.getLocaleThousandsSeparator();
      this.setAndPutString(callingMod.wasmMem, lconvIdx+0, locDec, codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+4, locSep, codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+20, locDec, codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+24, locSep, codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+24, locSep, codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+24, locSep, codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+32, "+", codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+36, "-", codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+12, this.getLocalCurrencySymbol(), codePage);
      this.setAndPutString(callingMod.wasmMem, lconvIdx+16, this.getLocalCurrencySymbol(), codePage);
   }

   private getLocaleDecimalPoint() {
      const formatter = new Intl.NumberFormat();

      //console.log("dec resolvedOptions", formatter.resolvedOptions());

      // Format a test number to find out the decimal point.
      const formattedNumber = formatter.format(1.1);
      //console.log("dec formattedNumber", formattedNumber);

      // Find the character between the numeric parts.
      const decimalPoint = formattedNumber.replace(/[0-9]/g, '').charAt(0);

      return decimalPoint;
   }

   private getLocaleThousandsSeparator() {
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
   private getLocaleCurrencyDecimalPoint() {
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

   private getLocalCurrencySymbol() {
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


   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////
   /////////////////////////////////////////////////////////////////////////////////////////////

   /*
   struct locale_dtnames {
      const char* day[7];
      const char* abday[7];
      const char* month[12];
      const char* abmonth[12];
      const char* ampm[2];
   };
   */

   twrGetDtnames(callingMod:IWasmModule|twrWasmBase, codePage:number) {

      const malloc=callingMod.wasmMem.malloc;
      const dtnamesStructIdx:number=malloc(40*4);
      for (let i=0; i<7; i++)
         this.setAndPutString(callingMod.wasmMem, dtnamesStructIdx+i*4, this.getLocalizedDayName(i, 'long'), codePage);

      for (let i=0; i<7; i++)
         this.setAndPutString(callingMod.wasmMem, dtnamesStructIdx+(i+7)*4, this.getLocalizedDayName(i, 'short'), codePage);

      for (let i=0; i<12; i++)
         this.setAndPutString(callingMod.wasmMem, dtnamesStructIdx+(i+14)*4, this.getLocalizedMonthNames(i, 'long'), codePage);

      for (let i=0; i<12; i++)
         this.setAndPutString(callingMod.wasmMem, dtnamesStructIdx+(i+14+12)*4, this.getLocalizedMonthNames(i, 'short'), codePage);

      this.setAndPutString(callingMod.wasmMem, dtnamesStructIdx+(0+14+24)*4, this.getLocalizedAM(), codePage);
      this.setAndPutString(callingMod.wasmMem, dtnamesStructIdx+(1+14+24)*4, this.getLocalizedPM(), codePage);

      return dtnamesStructIdx;
   }

   private getLocalizedDayName(n:number, weekdayType:'long'|'short') {
      // Create a Date object for the desired day of the week
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + n);
      
      // Create an Intl.DateTimeFormat object with the desired locale and options
      const formatter = new Intl.DateTimeFormat(undefined, { weekday: weekdayType });
      
      // Format the date to get the full day name
      return formatter.format(date);
   }

   private getLocalizedMonthNames(n:number, monthType:'long'|'short') {
      const formatter = new Intl.DateTimeFormat(undefined, { month: monthType });
      const date = new Date(2000, n, 1);
      return formatter.format(date);
   }

   private getLocalizedAM() {
      // Create a Date object for a time in the morning
      const morningDate = new Date(2000, 0, 1, 9, 0, 0);

      // Create an Intl.DateTimeFormat object with the desired locale and options
      const formatter = new Intl.DateTimeFormat(undefined, {
         hour: 'numeric',
         hour12: true
      });

      // Format the date and get the parts
      const formattedParts = formatter.formatToParts(morningDate);

      // Find the part of the formatted string that corresponds to the day period (AM/PM)
      const dayPeriodPart = formattedParts.find(part => part.type === 'dayPeriod');

      return dayPeriodPart ? dayPeriodPart.value : '';
   }

   private getLocalizedPM() {
      // Create a Date object for a time in the afternoon
      const afternoonDate = new Date(2000, 0, 1, 15, 0, 0);

      // Create an Intl.DateTimeFormat object with the desired locale and options
      const formatter = new Intl.DateTimeFormat(undefined, {
         hour: 'numeric',
         hour12: true
      });

      // Format the date and get the parts
      const formattedParts = formatter.formatToParts(afternoonDate);

      // Find the part of the formatted string that corresponds to the day period (AM/PM)
      const dayPeriodPart = formattedParts.find(part => part.type === 'dayPeriod');

      return dayPeriodPart ? dayPeriodPart.value : '';
   }
}

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////


export function to1252(instr:string) {

   if (instr.codePointAt(0)==8239) return 32;  // turn narrow-no-break-space into space


   // this first switch statment fixes what appears to be a bug in safari 15.6.1 (17613.3.9.1.16) (comparisons to the character string fail)
   let cp=instr.codePointAt(0) || 0;

   switch(cp) {
      case 338: return 0x8C;
      case 339: return 0x9C;
      case 352: return 0x8A;
      case 353: return 0x9A;
      case 376: return 0x9F;
      case 381: return 0x8E;
      case 382: return 0x9E;
      case 402: return 0x83;
      case 710: return 0x88;
   }

   switch (instr.normalize()) {
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
   
   if (cp>255) {
      console.log("twr-wasm.to1252(): unable to convert: ", instr, cp);
      cp=0;
   }

   return cp;
}

///////////////////////////////////////////////////////////////////////////////////////////////


export function toASCII(instr:string) {
   if (instr=='ƒ') return 102; // lowercase 'f'
   if (instr.codePointAt(0)==8239) return 32;  // turn narrow-no-break-space into space

   let cp=instr.codePointAt(0) || 0;
   if (cp>127) return 63; // ASCII for "?"
   return cp;
}

///////////////////////////////////////////////////////////////////////////////////////////////

export class twrCodePageToUnicodeCodePoint {
	decoderUTF8 = new TextDecoder('utf-8');
	decoder1252 = new TextDecoder('windows-1252');

	convert(c:number, codePage:number) {
		let outstr:string;
		if (codePage==codePageUTF8) {
			outstr=this.decoderUTF8.decode(new Uint8Array([c]), {stream: true});
		}
		else if (codePage==codePage1252) {
			outstr = this.decoder1252.decode(new Uint8Array([c]));
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
}
