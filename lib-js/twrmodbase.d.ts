import { twrFloatUtil } from "./twrfloat.js";
import { IConsole, IConsoleBase, IConsoleStream, IConsoleCanvas } from "./twrcon.js";
export interface IModOpts {
    stdio?: IConsoleStream & IConsoleBase;
    d2dcanvas?: IConsoleCanvas & IConsoleBase;
    io?: {
        [key: string]: IConsole;
    };
    windim?: [number, number];
    forecolor?: string;
    backcolor?: string;
    fontsize?: number;
    imports?: {};
}
/*********************************************************************/
/*********************************************************************/
/*********************************************************************/
export declare abstract class twrWasmModuleBase {
    memory?: WebAssembly.Memory;
    mem8: Uint8Array;
    mem32: Uint32Array;
    memD: Float64Array;
    abstract malloc: (size: number) => Promise<number>;
    exports?: WebAssembly.Exports;
    isAsyncProxy: boolean;
    floatUtil: twrFloatUtil;
    constructor();
    /*********************************************************************/
    /*********************************************************************/
    loadWasm(pathToLoad: string, imports: WebAssembly.ModuleImports, ioNamesToID: {
        [key: string]: number;
    }): Promise<void>;
    private init;
    callC(params: [string, ...(string | number | bigint | ArrayBuffer | URL)[]]): Promise<any>;
    callCImpl(fname: string, cparams?: (number | bigint)[]): Promise<any>;
    preCallC(params: [string, ...(string | number | bigint | ArrayBuffer | URL)[]]): Promise<(number | bigint)[]>;
    postCallC(cparams: (number | bigint)[], params: [string, ...(string | number | bigint | ArrayBuffer | URL)[]]): Promise<(number | bigint)[]>;
    /*********************************************************************/
    /*********************************************************************/
    stringToU8(sin: string, codePage?: number): Uint8Array;
    copyString(buffer: number, buffer_size: number, sin: string, codePage?: number): void;
    putString(sin: string, codePage?: number): Promise<number>;
    putU8(u8a: Uint8Array): Promise<number>;
    putArrayBuffer(ab: ArrayBuffer): Promise<number>;
    fetchAndPutURL(fnin: URL): Promise<number[]>;
    getLong(idx: number): number;
    setLong(idx: number, value: number): void;
    getDouble(idx: number): number;
    setDouble(idx: number, value: number): void;
    getShort(idx: number): number;
    getString(strIndex: number, len?: number, codePage?: number): string;
    getU8Arr(idx: number): Uint8Array;
    getU32Arr(idx: number): Uint32Array;
}
//# sourceMappingURL=twrmodbase.d.ts.map