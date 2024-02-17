import { twrSharedCircularBuffer } from "./twrcircular";
export declare function debugLog(char: number): void;
export type TDivProxyParams = [SharedArrayBuffer];
export interface IDiv {
    charOut: (ds: number) => void;
    charIn?: () => number;
    inkey?: () => number;
    getDivProxyParams?: () => TDivProxyParams;
}
export declare class twrDiv implements IDiv {
    div: HTMLDivElement | null | undefined;
    divKeys: twrSharedCircularBuffer;
    CURSOR: string;
    cursorOn: boolean;
    lastChar: number;
    extraBR: boolean;
    constructor(element: HTMLDivElement | null | undefined, forecolor: string, backcolor: string, fontsize: number);
    isValid(): boolean;
    getDivProxyParams(): TDivProxyParams;
    charOut(ch: number): void;
}
export declare class twrDivProxy implements IDiv {
    divKeys: twrSharedCircularBuffer;
    constructor(params: TDivProxyParams);
    charIn(): number;
    inkey(): number;
    charOut(ch: number): void;
}
//# sourceMappingURL=twrdiv.d.ts.map