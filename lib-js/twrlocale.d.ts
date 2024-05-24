import { twrWasmModuleBase } from "./twrmodbase.js";
export declare const codePageASCII = 0;
export declare const codePage1252 = 1252;
export declare const codePageUTF8 = 65001;
export declare const codePageUTF16 = 1200;
export declare function decodeByteUsingCodePage(c: number, codePage: number): string;
export declare function twrUserLanguageImpl(this: twrWasmModuleBase): number;
export declare function twrRegExpTest1252Impl(this: twrWasmModuleBase, regexpStrIdx: number, c: number): 0 | 1;
export declare function twrToLower1252Impl(this: twrWasmModuleBase, c: number): number;
export declare function twrToUpper1252Impl(this: twrWasmModuleBase, c: number): number;
export declare function twrStrcollImpl(this: twrWasmModuleBase, lhs: number, rhs: number, codePage: number): number;
export declare function twrTimeTmLocalImpl(this: twrWasmModuleBase, tmIdx: number, epochSecs: number): void;
export declare function twrUserLconvImpl(this: twrWasmModuleBase, lconvIdx: number, codePage: number): void;
//# sourceMappingURL=twrlocale.d.ts.map