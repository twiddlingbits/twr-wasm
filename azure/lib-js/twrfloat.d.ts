import { twrWasmModuleBase } from "./twrmodbase.js";
export declare class twrFloatUtil {
    mod: twrWasmModuleBase;
    constructor(mod: twrWasmModuleBase);
    atod(strptr: number): number;
    dtoa(buffer: number, buffer_size: number, value: number, max_precision: number): void;
    fcvtS(buffer: number, // char *
    sizeInBytes: number, //size_t
    value: number, // double
    fracpart_numdigits: number, //int
    dec: number, // int *
    sign: number): number;
}
//# sourceMappingURL=twrfloat.d.ts.map