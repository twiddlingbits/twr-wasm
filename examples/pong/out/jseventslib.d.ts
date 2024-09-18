import { IWasmModule, IWasmModuleAsync, twrLibrary, TLibImports } from "twr-wasm";
export default class twrLibExample extends twrLibrary {
    imports: TLibImports;
    registerKeyUpEvent(mod: IWasmModule | IWasmModuleAsync, eventID: number): void;
}
//# sourceMappingURL=jseventslib.d.ts.map