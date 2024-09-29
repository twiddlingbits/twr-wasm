import { IAllProxyParams } from "./twrmodasyncproxy.js";
import { IConsole } from "./twrcon.js";
import { IModOpts } from './twrmodutil.js';
import { IWasmMemoryAsync } from "./twrwasmmem.js";
import { twrWasmModuleCallAsync, TCallCAsync, TCallCImplAsync } from "./twrwasmcall.js";
import { TLibraryMessage } from "./twrlibrary.js";
import { twrEventQueueSend } from "./twreventqueue.js";
export type TModuleMessage = [msgClass: "twrWasmModule", id: number, msgType: string, ...params: any[]];
export type TModAsyncMessage = TLibraryMessage | TModuleMessage;
export interface IWasmModuleAsync extends Partial<IWasmMemoryAsync> {
    wasmMem: IWasmMemoryAsync;
    callCInstance: twrWasmModuleCallAsync;
    callC: TCallCAsync;
    callCImpl: TCallCImplAsync;
    eventQueueSend: twrEventQueueSend;
    isTwrWasmModuleAsync: true;
    loadWasm: (pathToLoad: string) => Promise<void>;
    postEvent: (eventID: number, ...params: number[]) => void;
    fetchAndPutURL: (fnin: URL) => Promise<[number, number]>;
    divLog: (...params: string[]) => void;
    log: (...params: string[]) => void;
}
export type TModAsyncProxyStartupMsg = {
    urlToLoad: string;
    allProxyParams: IAllProxyParams;
};
interface ICallCPromise {
    callCResolve: (value: any) => void;
    callCReject: (reason?: any) => void;
}
export declare class twrWasmModuleAsync implements IWasmModuleAsync {
    myWorker: Worker;
    loadWasmResolve?: (value: void) => void;
    loadWasmReject?: (reason?: any) => void;
    callCMap: Map<number, ICallCPromise>;
    uniqueInt: number;
    initLW: boolean;
    io: {
        [key: string]: IConsole;
    };
    ioNamesToID: {
        [key: string]: number;
    };
    wasmMem: IWasmMemoryAsync;
    callCInstance: twrWasmModuleCallAsync;
    eventQueueSend: twrEventQueueSend;
    isTwrWasmModuleAsync: true;
    divLog: (...params: string[]) => void;
    log: (...params: string[]) => void;
    memory: WebAssembly.Memory;
    exports: WebAssembly.Exports;
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
    malloc: (size: number) => Promise<number>;
    free: (size: number) => Promise<void>;
    putString: (sin: string, codePage?: number) => Promise<number>;
    putU8: (u8a: Uint8Array) => Promise<number>;
    putArrayBuffer: (ab: ArrayBuffer) => Promise<number>;
    constructor(opts?: IModOpts);
    loadWasm(pathToLoad: string): Promise<void>;
    postEvent(eventID: number, ...params: number[]): void;
    callC(params: [string, ...(string | number | bigint | ArrayBuffer)[]]): Promise<any>;
    callCImpl(fname: string, cparams?: (number | bigint)[]): Promise<any>;
    mallocImpl(size: number): Promise<any>;
    keyDown(ev: KeyboardEvent): void;
    keyDownDiv(ev: KeyboardEvent): void;
    keyDownCanvas(ev: KeyboardEvent): void;
    processMsg(event: MessageEvent<TModAsyncMessage>): Promise<void>;
    fetchAndPutURL(fnin: URL): Promise<[number, number]>;
}
export {};
//# sourceMappingURL=twrmodasync.d.ts.map