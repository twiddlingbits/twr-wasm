import { twrLibrary, TLibImports } from "./twrlibrary.js";
import { IWasmModule } from "./twrmod.js";
import { twrWasmBase } from "./twrwasmbase.js";
export declare const codePageASCII = 0;
export declare const codePage1252 = 1252;
export declare const codePageUTF8 = 65001;
export declare const codePageUTF32 = 12000;
export default class twrLibLocale extends twrLibrary {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    cpTranslate: twrCodePageToUnicodeCodePoint;
    cpTranslate2: twrCodePageToUnicodeCodePoint;
    constructor();
    twrCodePageToUnicodeCodePoint(callingMod: IWasmModule | twrWasmBase, c: number, codePage: number): number;
    twrUnicodeCodePointToCodePage(callingMod: IWasmModule | twrWasmBase, outstr: number, cp: number, codePage: number): number;
    twrUserLanguage(callingMod: IWasmModule | twrWasmBase): number;
    twrRegExpTest1252(callingMod: IWasmModule | twrWasmBase, regexpStrIdx: number, c: number): 0 | 1;
    twrToLower1252(callingMod: IWasmModule | twrWasmBase, c: number): number;
    twrToUpper1252(callingMod: IWasmModule | twrWasmBase, c: number): number;
    twrStrcoll(callingMod: IWasmModule | twrWasmBase, lhs: number, rhs: number, codePage: number): number;
    twrTimeTmLocal(callingMod: IWasmModule | twrWasmBase, tmIdx: number, epochSecs: number): void;
    private getDayOfYear;
    private isDst;
    private getTZ;
    private setAndPutString;
    twrUserLconv(callingMod: IWasmModule | twrWasmBase, lconvIdx: number, codePage: number): void;
    private getLocaleDecimalPoint;
    private getLocaleThousandsSeparator;
    private getLocaleCurrencyDecimalPoint;
    private getLocalCurrencySymbol;
    twrGetDtnames(callingMod: IWasmModule | twrWasmBase, codePage: number): number;
    private getLocalizedDayName;
    private getLocalizedMonthNames;
    private getLocalizedAM;
    private getLocalizedPM;
}
export declare function to1252(instr: string): number;
export declare function toASCII(instr: string): number;
export declare class twrCodePageToUnicodeCodePoint {
    decoderUTF8: TextDecoder;
    decoder1252: TextDecoder;
    convert(c: number, codePage: number): number;
}
//# sourceMappingURL=twrliblocale.d.ts.map