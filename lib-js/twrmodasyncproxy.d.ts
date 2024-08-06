import { twrWasmModuleBase } from "./twrmodbase.js";
import { twrCodePageToUnicodeCodePoint } from "./twrlocale.js";
import { TWaitingCallsProxyParams } from "./twrwaitingcalls.js";
import { TConsoleProxyParams } from "./twrcon.js";
export interface IAllProxyParams {
    conProxyParams: TConsoleProxyParams[];
    ioNamesToID: {
        [key: string]: number;
    };
    waitingCallsProxyParams: TWaitingCallsProxyParams;
}
export declare class twrWasmModuleAsyncProxy extends twrWasmModuleBase {
    malloc: (size: number) => Promise<number>;
    imports: WebAssembly.ModuleImports;
    ioNamesToID: {
        [key: string]: number;
    };
    cpTranslate: twrCodePageToUnicodeCodePoint;
    private getProxyInstance;
    constructor(allProxyParams: IAllProxyParams);
    loadWasm(pathToLoad: string): Promise<void>;
}
//# sourceMappingURL=twrmodasyncproxy.d.ts.map