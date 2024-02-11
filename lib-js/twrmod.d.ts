import { twrDiv } from "./twrdiv.js";
import { twrCanvas } from "./twrcanvas.js";
export type TstdioVals = "div" | "canvas" | "null" | "debug";
export interface ItwrModOpts {
    stdio?: TstdioVals;
    windim?: [number, number];
}
export declare class twrWasmModuleBase {
    canvas: twrCanvas;
    winWidth: number;
    winHeight: number;
    div: twrDiv;
    isWorker: boolean;
    opts: ItwrModOpts;
    constructor(opts?: ItwrModOpts);
    nullin(): number;
}
export declare class twrWasmModule extends twrWasmModuleBase {
    exports: WebAssembly.Exports | undefined;
    mem8: Uint8Array | undefined;
    constructor(opts: ItwrModOpts);
    loadWasm(urToLoad: string | URL, imports?: {}): Promise<void>;
    private twrInit;
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    executeC(params: [string, ...(string | number | Uint8Array | URL)[]]): Promise<any>;
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    stringToMem(sin: string): number;
    uint8ArrayToMem(src: Uint8Array): number;
    urlToMem(fnin: URL): Promise<number[]>;
    memToString(strIndex: number): string;
}
//# sourceMappingURL=twrmod.d.ts.map