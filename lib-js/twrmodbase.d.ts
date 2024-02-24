import { TCanvasProxyParams } from "./twrcanvas.js";
import { TDivProxyParams } from "./twrdiv.js";
import { TWaitingCallsProxyParams as TWaitingCallsProxyParams } from "./twrwaitingcalls.js";
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
    imports: {};
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
    mem8: Uint8Array;
    memory?: WebAssembly.Memory;
    abstract malloc: (size: number) => Promise<number>;
    abstract modParams: IModParams;
    exports?: WebAssembly.Exports;
    isWorker: boolean;
    constructor();
    /*********************************************************************/
    /*********************************************************************/
    loadWasm(fileToLoad: string): Promise<void>;
    private init;
    executeC(params: [string, ...(string | number | Uint8Array | URL)[]]): Promise<any>;
    executeCImpl(fname: string, cparams?: number[]): Promise<any>;
    convertParams(params: [string, ...(string | number | Uint8Array | URL)[]]): Promise<number[]>;
    /*********************************************************************/
    /*********************************************************************/
    putString(sin: string): Promise<number>;
    putU8(src: Uint8Array): Promise<number>;
    fetchAndPutURL(fnin: URL): Promise<number[]>;
    getLong(idx: number): number;
    getShort(idx: number): number;
    getString(strIndex: number, len?: number): string;
    getU8Arr(idx: number): Uint8Array;
    getU32Arr(idx: number): Uint32Array;
}
//# sourceMappingURL=twrmodbase.d.ts.map