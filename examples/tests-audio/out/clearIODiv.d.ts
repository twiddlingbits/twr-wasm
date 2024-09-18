import { IWasmModule, IWasmModuleAsync, twrLibrary, TLibImports } from "twr-wasm";
export default class clearIODivLib extends twrLibrary {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    constructor();
    clearIODiv(mod: IWasmModule | IWasmModuleAsync): void;
}
//# sourceMappingURL=clearIODiv.d.ts.map