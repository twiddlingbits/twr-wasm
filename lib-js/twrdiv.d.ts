import { twrSharedCircularBuffer } from "./twrcircular.js";
import { IModParams } from "./twrmodbase.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
export type TDivProxyParams = [SharedArrayBuffer];
export interface IDiv {
    charOut: (ds: number) => void;
    charIn?: () => number;
    inkey?: () => number;
    getProxyParams?: () => TDivProxyParams;
}
export declare class twrDiv implements IDiv {
    div: HTMLDivElement | null | undefined;
    divKeys?: twrSharedCircularBuffer;
    CURSOR: string;
    cursorOn: boolean;
    lastChar: number;
    extraBR: boolean;
    owner: twrWasmModuleBase;
    decoder: TextDecoder;
    constructor(element: HTMLDivElement | null | undefined, modParams: IModParams, modbase: twrWasmModuleBase);
    isValid(): boolean;
    getProxyParams(): TDivProxyParams;
    charOut(ch: number): void;
    stringOut(str: string): void;
}
export declare class twrDivProxy implements IDiv {
    divKeys: twrSharedCircularBuffer;
    constructor(params: TDivProxyParams);
    charIn(): number;
    inkey(): number;
    charOut(ch: number): void;
}
//# sourceMappingURL=twrdiv.d.ts.map