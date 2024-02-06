import { twrCanvas } from "./twrcanvas.js";
export interface twrFileName {
    twrFileName: string;
}
export declare function twrIsFileName(x: any): x is twrFileName;
export type TprintfVals = "div_twr_stdout" | "null" | "debugcon";
export interface IloadWasmOpts {
    printf?: TprintfVals;
    imports?: {};
}
export declare class twrWasmModule {
    exports: WebAssembly.Exports | undefined;
    mem8: Uint8Array | undefined;
    canvas: twrCanvas | undefined;
    constructor();
    loadWasm(urToLoad: string | URL, opts?: IloadWasmOpts): Promise<void>;
    private twrInit;
    private charToIn;
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    executeC(params: [string, ...(string | number | Uint8Array | twrFileName)[]]): Promise<any>;
    /*********************************************************************/
    /*********************************************************************/
    /*********************************************************************/
    stringToMem(sin: string): number;
    uint8ArrayToMem(src: Uint8Array): number;
    fileToMem(fnin: string | twrFileName): Promise<number[]>;
    memToString(strIndex: number): string;
}
//# sourceMappingURL=twrmod.d.ts.map