import { IConsoleStreamOut, IConsoleStreamIn, IConsoleCanvas, IConsoleAddressable, ICanvasProps } from "./twrcon.js";
import { IWasmModuleAsync } from "./twrmodasync.js";
import { IWasmModule } from "./twrmod.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export default class twrConsoleDummy extends twrLibrary implements IConsoleStreamIn, IConsoleStreamOut, IConsoleAddressable, IConsoleCanvas {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    interfaceName: string;
    constructor();
    twrConGetProp(callingMod: IWasmModule | IWasmModuleAsync, pn: number): number;
    keyDown(ev: KeyboardEvent): void;
    twrConCharOut(callingMod: any, c: number, codePage: number): void;
    twrConPutStr(callingMod: IWasmModule | IWasmModuleAsync, chars: number, codePage: number): void;
    twrConSetC32(callingMod: any, location: number, c32: number): void;
    twrConCls(): void;
    twrConSetRange(callingMod: IWasmModule | IWasmModuleAsync, chars: number, start: number, len: number): void;
    setRangeJS(start: number, values: number[]): void;
    twrConSetReset(callingMod: IWasmModule | IWasmModuleAsync, x: number, y: number, isset: boolean): void;
    twrConPoint(callingMod: IWasmModule | IWasmModuleAsync, x: number, y: number): boolean;
    twrConSetCursor(callingMod: IWasmModule | IWasmModuleAsync, location: number): void;
    twrConSetCursorXY(callingMod: IWasmModule | IWasmModuleAsync, x: number, y: number): void;
    twrConSetColors(callingMod: IWasmModule | IWasmModuleAsync, foreground: number, background: number): void;
    twrConCharIn_async(callingMod: IWasmModuleAsync): Promise<number>;
    twrConSetFocus(): void;
    twrConDrawSeq(mod: IWasmModuleAsync | IWasmModule, ds: number): void;
    getProp(name: keyof ICanvasProps): number;
    putStr(str: string): void;
    charOut(c32: string): void;
    twrConLoadImage_async(mod: IWasmModuleAsync, urlPtr: number, id: number): Promise<number>;
}
//# sourceMappingURL=twrcondummy.d.ts.map