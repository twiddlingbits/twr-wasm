import { IModOpts } from "./twrmodutil.js";
import { IConsole } from "./twrcon.js";
import { IWasmMemory } from './twrwasmmem.js';
import { twrWasmCall } from "./twrwasmcall.js";
import { twrWasmBase, TOnEventCallback } from "./twrwasmbase.js";
/*********************************************************************/
export interface IWasmModule extends Partial<IWasmMemory> {
    wasmMem: IWasmMemory;
    wasmCall: twrWasmCall;
    callC: twrWasmCall["callC"];
    isTwrWasmModuleAsync: false;
    loadWasm: (pathToLoad: string) => Promise<void>;
    postEvent: TOnEventCallback;
    fetchAndPutURL: (fnin: URL) => Promise<[number, number]>;
    divLog: (...params: string[]) => void;
    log: (...params: string[]) => void;
}
/*********************************************************************/
export declare class twrWasmModule extends twrWasmBase implements IWasmModule {
    io: {
        [key: string]: IConsole;
    };
    ioNamesToID: {
        [key: string]: number;
    };
    isTwrWasmModuleAsync: false;
    divLog: (...params: string[]) => void;
    log: (...params: string[]) => void;
    memory: WebAssembly.Memory;
    mem8: Uint8Array;
    mem32: Uint32Array;
    memD: Float64Array;
    stringToU8: (sin: string, codePage?: number) => Uint8Array;
    copyString: (buffer: number, buffer_size: number, sin: string, codePage?: number) => void;
    getLong: (idx: number) => number;
    setLong: (idx: number, value: number) => void;
    getDouble: (idx: number) => number;
    setDouble: (idx: number, value: number) => void;
    getShort: (idx: number) => number;
    getString: (strIndex: number, len?: number, codePage?: number) => string;
    getU8Arr: (idx: number) => Uint8Array;
    getU32Arr: (idx: number) => Uint32Array;
    malloc: (size: number) => number;
    free: (size: number) => void;
    putString: (sin: string, codePage?: number) => number;
    putU8: (u8a: Uint8Array) => number;
    putArrayBuffer: (ab: ArrayBuffer) => number;
    /*********************************************************************/
    constructor(opts?: IModOpts);
    /*********************************************************************/
    loadWasm(pathToLoad: string): Promise<void>;
    /*********************************************************************/
    fetchAndPutURL(fnin: URL): Promise<[number, number]>;
    postEvent(eventID: number, ...params: number[]): void;
    peekEvent(eventName: string): void;
}
//# sourceMappingURL=twrmod.d.ts.map