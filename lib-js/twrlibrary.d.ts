import { IWasmModule } from "./twrmod.js";
import { IWasmModuleAsync } from "./twrmodasync.js";
import { twrWasmModuleAsyncProxy } from "./twrmodasyncproxy.js";
export type TLibImports = {
    [key: string]: {
        isAsyncFunction?: boolean;
        isModuleAsyncOnly?: boolean;
        isCommonCode?: boolean;
        noBlock?: boolean;
    };
};
export type TLibraryProxyParams = ["twrLibraryProxy", libID: number, imports: TLibImports, libSourcePath: string, interfaceName: string | undefined];
export type TLibraryMessage = ["twrLibrary", libID: number, funcName: string, isAsyncOverride: boolean, returnValueEventID: number, ...args: any[]];
export declare abstract class twrLibrary {
    abstract id: number;
    abstract imports: TLibImports;
    abstract libSourcePath: string;
    interfaceName?: string;
    constructor();
    getImports(callingMod: IWasmModule): {
        [key: string]: Function;
    };
    getProxyParams(): TLibraryProxyParams;
    processMessageFromProxy(msg: TLibraryMessage, mod: IWasmModuleAsync): Promise<void>;
}
export declare class twrLibraryProxy {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    interfaceName?: string;
    called: boolean;
    constructor(params: TLibraryProxyParams);
    private remoteProcedureCall;
    getProxyImports(ownerMod: twrWasmModuleAsyncProxy): Promise<{
        [key: string]: Function;
    }>;
}
export declare class twrLibraryInstanceRegistry {
    static libInstances: twrLibrary[];
    static libInterfaceInstances: twrLibrary[];
    static register(libInstance: twrLibrary): number;
    static getLibraryInstance(id: number): twrLibrary;
    static getLibraryInstanceByInterfaceName(name: string): number | undefined;
    static getLibraryInstanceByClass(path: string): twrLibrary[] | undefined;
    static getLibraryInstanceID(libInstance: twrLibrary): number;
}
export declare class twrLibraryInstanceProxyRegistry {
    static libProxyInstances: twrLibraryProxy[];
    static registerProxy(libProxyInstance: twrLibraryProxy): number;
    static getLibraryInstanceProxy(id: number): twrLibraryProxy;
    static getLibraryInstanceID(libProxyInstance: twrLibraryProxy): number;
}
//# sourceMappingURL=twrlibrary.d.ts.map