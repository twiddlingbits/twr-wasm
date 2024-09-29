import { twrWasmMemory, twrWasmMemoryAsync } from "./twrwasmmem";
export declare class twrWasmCall {
    exports: WebAssembly.Exports;
    mem: twrWasmMemory;
    constructor(mem: twrWasmMemory, exports: WebAssembly.Exports);
    callCImpl(fname: string, cparams?: (number | bigint)[]): any;
    callC(params: [string, ...(string | number | bigint | ArrayBuffer)[]]): any;
    preCallC(params: [string, ...(string | number | bigint | ArrayBuffer)[]]): (number | bigint)[];
    postCallC(cparams: (number | bigint)[], params: [string, ...(string | number | bigint | ArrayBuffer)[]]): (number | bigint)[];
}
export type TCallCImplAsync = (fname: string, cparams: (number | bigint)[]) => Promise<any>;
export type TCallCAsync = (params: [string, ...(string | number | bigint | ArrayBuffer)[]]) => Promise<any>;
export declare class twrWasmModuleCallAsync {
    mem: twrWasmMemoryAsync;
    callCImpl: TCallCImplAsync;
    constructor(mem: twrWasmMemoryAsync, callCImpl: TCallCImplAsync);
    preCallC(params: [string, ...(string | number | bigint | ArrayBuffer)[]]): Promise<(number | bigint)[]>;
    postCallC(cparams: (number | bigint)[], params: [string, ...(string | number | bigint | ArrayBuffer)[]]): Promise<(number | bigint)[]>;
}
//# sourceMappingURL=twrwasmcall.d.ts.map