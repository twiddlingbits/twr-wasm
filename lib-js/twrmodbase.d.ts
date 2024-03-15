import { TCanvasProxyParams } from "./twrcanvas.js";
import { TDivProxyParams } from "./twrdiv.js";
import { TWaitingCallsProxyParams } from "./twrwaitingcalls.js";
import { twrFloatUtil } from "./twrfloat.js";
export type TStdioVals = "div" | "canvas" | "null" | "debug";
export interface IModOpts {
    stdio?: TStdioVals;
    windim?: [number, number];
    forecolor?: string;
    backcolor?: string;
    fontsize?: number;
    isd2dcanvas?: boolean;
    imports?: {};
}
export interface IModParams {
    stdio: TStdioVals;
    windim: [number, number];
    forecolor: string;
    backcolor: string;
    fontsize: number;
    styleIsDefault: boolean;
    isd2dcanvas: boolean;
    imports: {
        [index: string]: Function;
    };
}
export interface IModInWorkerParams {
    divProxyParams: TDivProxyParams;
    canvasProxyParams: TCanvasProxyParams;
    waitingCallsProxyParams: TWaitingCallsProxyParams;
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
    abstract modParams: IModParams;
    exports?: WebAssembly.Exports;
    isWorker: boolean;
    isWasmModule: boolean;
    floatUtil: twrFloatUtil;
    constructor();
    /*********************************************************************/
    /*********************************************************************/
    loadWasm(fileToLoad: string): Promise<void>;
    private init;
    executeC(params: [string, ...(string | number | ArrayBuffer | URL)[]]): Promise<any>;
    executeCImpl(fname: string, cparams?: number[]): Promise<any>;
    preCallC(params: [string, ...(string | number | ArrayBuffer | URL)[]]): Promise<number[]>;
    postCallC(cparams: number[], params: [string, ...(string | number | ArrayBuffer | URL)[]]): Promise<number[]>;
    /*********************************************************************/
    /*********************************************************************/
    copyString(buffer: number, buffer_size: number, sin: string): void;
    putString(sin: string): Promise<number>;
    putU8(u8a: Uint8Array): Promise<number>;
    putArrayBuffer(ab: ArrayBuffer): Promise<number>;
    fetchAndPutURL(fnin: URL): Promise<number[]>;
    getLong(idx: number): number;
    setLong(idx: number, value: number): void;
    getDouble(idx: number): number;
    setDouble(idx: number, value: number): void;
    getShort(idx: number): number;
    getString(strIndex: number, len?: number): string;
    getU8Arr(idx: number): Uint8Array;
    getU32Arr(idx: number): Uint32Array;
}
//# sourceMappingURL=twrmodbase.d.ts.map