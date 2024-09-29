import { IWasmModule } from "./twrmod.js";
import { twrWasmBase } from "./twrwasmbase.js";
import { twrLibrary, TLibImports } from "./twrlibrary.js";
export default class twrLibMath extends twrLibrary {
    id: number;
    imports: TLibImports;
    libSourcePath: string;
    constructor();
    twrSin(callingMod: IWasmModule | twrWasmBase, angle: number): number;
    twrCos(callingMod: IWasmModule | twrWasmBase, angle: number): number;
    twrTan(callingMod: IWasmModule | twrWasmBase, angle: number): number;
    twrACos(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrASin(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrATan(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrATan2(callingMod: IWasmModule | twrWasmBase, y: number, x: number): number;
    twrFAbs(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrExp(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrFloor(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrCeil(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrLog(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrSqrt(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrTrunc(callingMod: IWasmModule | twrWasmBase, p: number): number;
    twrFMod(callingMod: IWasmModule | twrWasmBase, x: number, y: number): number;
    twrPow(callingMod: IWasmModule | twrWasmBase, x: number, y: number): number;
    twrAtod(callingMod: IWasmModule | twrWasmBase, ...p: [number, number]): number;
    twrDtoa(callingMod: IWasmModule | twrWasmBase, ...p: [number, number, number, number]): void;
    twrToFixed(callingMod: IWasmModule | twrWasmBase, ...p: [number, number, number, number]): void;
    twrToExponential(callingMod: IWasmModule | twrWasmBase, ...p: [number, number, number, number]): void;
    twrFcvtS(callingMod: IWasmModule | twrWasmBase, ...p: [number, number, number, number, number, number]): number;
    private atod;
    private dtoa;
    private toFixed;
    private toExponential;
    private fcvtS;
}
//# sourceMappingURL=twrlibmath.d.ts.map