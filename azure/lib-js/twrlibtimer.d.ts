import { IWasmModule } from "./twrmod.js";
import { IWasmModuleAsync } from "./twrmodasync.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export default class twrLibTimer extends twrLibrary {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    constructor();
    twr_timer_single_shot(callingMod: IWasmModule | IWasmModuleAsync, milliSeconds: number, eventID: number): number;
    twr_timer_repeat(callingMod: IWasmModule | IWasmModuleAsync, milliSeconds: number, eventID: number): number;
    twr_timer_cancel(callingMod: IWasmModule | IWasmModuleAsync, timerID: number): void;
    twr_sleep_async(callingMod: IWasmModuleAsync, milliSeconds: number): Promise<void>;
}
//# sourceMappingURL=twrlibtimer.d.ts.map