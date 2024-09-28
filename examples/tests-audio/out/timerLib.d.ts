import { IWasmModule, IWasmModuleAsync, twrLibrary, TLibImports } from "twr-wasm";
export default class timerLib extends twrLibrary {
    imports: TLibImports;
    setTimeout(mod: IWasmModule | IWasmModuleAsync, eventID: number, time: number, args: number): void;
}
//# sourceMappingURL=timerLib.d.ts.map