import { twrWasmBase } from "./twrwasmbase.js";
import { TLibraryProxyParams } from "./twrlibrary.js";
import { twrEventQueueReceive } from "./twreventqueue.js";
export interface IAllProxyParams {
    libProxyParams: TLibraryProxyParams[];
    ioNamesToID: {
        [key: string]: number;
    };
    eventQueueBuffer: SharedArrayBuffer;
}
export declare class twrWasmModuleAsyncProxy extends twrWasmBase {
    allProxyParams: IAllProxyParams;
    ioNamesToID: {
        [key: string]: number;
    };
    libimports: WebAssembly.ModuleImports;
    eventQueueReceive: twrEventQueueReceive;
    constructor(allProxyParams: IAllProxyParams);
    loadWasm(pathToLoad: string): Promise<void>;
}
//# sourceMappingURL=twrmodasyncproxy.d.ts.map