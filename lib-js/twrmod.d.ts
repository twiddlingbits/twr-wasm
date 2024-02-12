import { twrDiv } from "./twrdiv.js";
import { twrCanvas } from "./twrcanvas.js";
export type TstdioVals = "div" | "canvas" | "null" | "debug";
export interface ItwrModOpts {
    stdio?: TstdioVals;
    windim?: [number, number];
    memory?: WebAssembly.Memory;
}
export declare class twrWasmModuleBase {
    canvas: twrCanvas;
    winWidth: number;
    winHeight: number;
    div: twrDiv;
    isWorker: boolean;
    opts: ItwrModOpts;
    mem8: Uint8Array;
    memory: WebAssembly.Memory;
    malloc: (size: number) => Promise<number>;
    constructor(memory: WebAssembly.Memory, opts?: ItwrModOpts);
    null(): number;
    stringToMem(sin: string): Promise<number>;
    uint8ArrayToMem(src: Uint8Array): Promise<number>;
    urlToMem(fnin: URL): Promise<number[]>;
    memToString(strIndex: number): string;
    memToUint8Array(idx: number): Uint8Array;
    memToUint32Array(idx: number): Uint32Array;
    convertParams(params: [string, ...(string | number | Uint8Array | URL)[]]): Promise<number[]>;
}
export declare class twrWasmModule extends twrWasmModuleBase {
    exports: WebAssembly.Exports | undefined;
    constructor(opts?: ItwrModOpts);
    loadWasm(urToLoad: URL, imports?: {}): Promise<void>;
    private twrInit;
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    executeC(params: [string, ...(string | number | Uint8Array | URL)[]]): Promise<any>;
    executeCImpl(fname: string, cparams?: number[]): Promise<any>;
}
//# sourceMappingURL=twrmod.d.ts.map