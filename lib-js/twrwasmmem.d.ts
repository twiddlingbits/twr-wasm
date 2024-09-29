export interface IWasmMemoryBase {
    memory: WebAssembly.Memory;
    mem8: Uint8Array;
    mem16: Uint16Array;
    mem32: Uint32Array;
    memF: Float32Array;
    memD: Float64Array;
    stringToU8(sin: string, codePage?: number): Uint8Array;
    copyString(buffer: number, buffer_size: number, sin: string, codePage?: number): void;
    getLong(idx: number): number;
    setLong(idx: number, value: number): void;
    getDouble(idx: number): number;
    setDouble(idx: number, value: number): void;
    getShort(idx: number): number;
    getString(strIndex: number, len?: number, codePage?: number): string;
    getU8Arr(idx: number): Uint8Array;
    getU32Arr(idx: number): Uint32Array;
}
export interface IWasmMemory extends IWasmMemoryBase {
    malloc: (size: number) => number;
    free: (size: number) => void;
    putString(sin: string, codePage?: number): number;
    putU8(u8a: Uint8Array): number;
    putArrayBuffer(ab: ArrayBuffer): number;
}
export interface IWasmMemoryAsync extends IWasmMemoryBase {
    malloc: (size: number) => Promise<number>;
    free: (size: number) => Promise<void>;
    putString(sin: string, codePage?: number): Promise<number>;
    putU8(u8a: Uint8Array): Promise<number>;
    putArrayBuffer(ab: ArrayBuffer): Promise<number>;
}
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
export declare class twrWasmMemoryBase implements IWasmMemoryBase {
    memory: WebAssembly.Memory;
    mem8: Uint8Array;
    mem16: Uint16Array;
    mem32: Uint32Array;
    memF: Float32Array;
    memD: Float64Array;
    constructor(memory: WebAssembly.Memory);
    stringToU8(sin: string, codePage?: number): Uint8Array;
    copyString(buffer: number, buffer_size: number, sin: string, codePage?: number): void;
    getLong(idx: number): number;
    setLong(idx: number, value: number): void;
    getDouble(idx: number): number;
    setDouble(idx: number, value: number): void;
    getShort(idx: number): number;
    getString(strIndex: number, len?: number, codePage?: number): string;
    getU8Arr(idx: number): Uint8Array;
    getU32Arr(idx: number): Uint32Array;
}
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
export declare class twrWasmMemory extends twrWasmMemoryBase implements IWasmMemory {
    malloc: (size: number) => number;
    free: (size: number) => void;
    constructor(memory: WebAssembly.Memory, free: (size: number) => void, malloc: (size: number) => number);
    putString(sin: string, codePage?: number): number;
    putU8(u8a: Uint8Array): number;
    putArrayBuffer(ab: ArrayBuffer): number;
}
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
export declare class twrWasmMemoryAsync extends twrWasmMemoryBase implements IWasmMemoryAsync {
    malloc: (size: number) => Promise<number>;
    free: (size: number) => Promise<void>;
    constructor(memory: WebAssembly.Memory, mallocImpl: (size: number) => Promise<number>, callCImpl: (funcName: string, any: [...any]) => Promise<any>);
    putString(sin: string, codePage?: number): Promise<number>;
    putU8(u8a: Uint8Array): Promise<number>;
    putArrayBuffer(ab: ArrayBuffer): Promise<number>;
}
//# sourceMappingURL=twrwasmmem.d.ts.map