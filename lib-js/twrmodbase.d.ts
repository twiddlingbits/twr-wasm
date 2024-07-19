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
export interface IModProxyParams {
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
    isAsyncProxy: boolean;
    isWasmModule: boolean;
    floatUtil: twrFloatUtil;
    constructor(isWasmModule?: boolean);
    /*********************************************************************/
    /*********************************************************************/
    loadWasm(pathToLoad: string): Promise<void>;
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