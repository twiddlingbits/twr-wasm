import { IConsoleCanvas, ICanvasProps } from "./twrcon.js";
import { IWasmModuleAsync } from "./twrmodasync.js";
import { IWasmModule } from "./twrmod.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export declare class twrConsoleCanvas extends twrLibrary implements IConsoleCanvas {
    id: number;
    ctx: CanvasRenderingContext2D;
    element: HTMLCanvasElement;
    props: ICanvasProps;
    precomputedObjects: {
        [index: number]: (ImageData | {
            mem8: Uint8Array;
            width: number;
            height: number;
        }) | CanvasGradient | HTMLImageElement;
    };
    imports: TLibImports;
    libSourcePath: string;
    interfaceName: string;
    constructor(element: HTMLCanvasElement);
    getProp(name: keyof ICanvasProps): number;
    twrConGetProp(callingMod: IWasmModule | IWasmModuleAsync, pn: number): number;
    twrConLoadImage_async(mod: IWasmModuleAsync, urlPtr: number, id: number): Promise<number>;
    twrConDrawSeq(mod: IWasmModuleAsync | IWasmModule, ds: number): void;
}
export default twrConsoleCanvas;
//# sourceMappingURL=twrconcanvas.d.ts.map