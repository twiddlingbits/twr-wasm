import { IWasmMemory } from './twrwasmmem.js';
import { twrWasmCall } from "./twrwasmcall.js";
export type TOnEventCallback = (eventID: number, ...args: number[]) => void;
export declare class twrWasmBase {
    exports: WebAssembly.Exports;
    wasmMem: IWasmMemory;
    wasmCall: twrWasmCall;
    callC: twrWasmCall["callC"];
    /*********************************************************************/
    private getImports;
    loadWasm(pathToLoad: string, imports: WebAssembly.ModuleImports): Promise<void>;
    registerCallback(funcNameIdx: number): number;
}
//# sourceMappingURL=twrwasmbase.d.ts.map