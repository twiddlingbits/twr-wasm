import { twrWasmModuleBase } from "./twrmodbase.js";
export declare function twrTimeEpochImpl(): number;
export declare function twrUserLanguageImpl(this: twrWasmModuleBase): number;
/** checks if the character c, when converted to a string, is matched by the passed in regexp string */
export declare function twrLocCharRegExpImpl(this: twrWasmModuleBase, regexpStrIdx: number, c: number): 0 | 1;
export declare function twrTimeTmLocalImpl(this: twrWasmModuleBase, tmIdx: number, epochSecs: number): void;
export declare function twrUserLconvImpl(this: twrWasmModuleBase, lconvIdx: number): void;
//# sourceMappingURL=twrdate.d.ts.map