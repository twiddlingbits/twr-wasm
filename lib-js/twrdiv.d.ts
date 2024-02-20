import { twrSharedCircularBuffer } from "./twrcircular";
import { IModParams } from "./twrmodbase";
export type TDivProxyParams = [SharedArrayBuffer];
export interface IDiv {
    charOut: (ds: number) => void;
    charIn?: () => number;
    inkey?: () => number;
    getProxyParams?: () => TDivProxyParams;
}
export declare class twrDiv implements IDiv {
    div: HTMLDivElement | null | undefined;
    divKeys: twrSharedCircularBuffer;
    CURSOR: string;
    cursorOn: boolean;
    lastChar: number;
    extraBR: boolean;
    constructor(element: HTMLDivElement | null | undefined, modParams: IModParams);
    isValid(): boolean;
    getProxyParams(): TDivProxyParams;
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