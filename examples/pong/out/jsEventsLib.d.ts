import { IWasmModule, IWasmModuleAsync, twrLibrary, TLibImports } from "twr-wasm";
export default class jsEventsLib extends twrLibrary {
    imports: TLibImports;
    registerKeyUpEvent(callingMod: IWasmModule | IWasmModuleAsync, eventID: number): void;
    registerKeyDownEvent(callingMod: IWasmModule | IWasmModuleAsync, eventID: number): void;
    registerAnimationLoop(callingMod: IWasmModule | IWasmModuleAsync, eventID: number): void;
    registerMouseMoveEvent(callingMod: IWasmModule | IWasmModuleAsync, eventID: number, elementIDPtr: number, relative: boolean): void;
    registerMousePressEvent(callingMod: IWasmModule | IWasmModuleAsync, eventID: number, elementIDPtr: number, relative: boolean): void;
    atan2(mod: IWasmModule | IWasmModuleAsync, y: number, x: number, retPtr: number): void;
}
//# sourceMappingURL=jsEventsLib.d.ts.map