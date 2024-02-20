// The Javascript side of my C maze program 
// My maze code was written along time ago in C for the Amiga, then ported some years later as a Windows screen saver. 
// Now, 20+ years later, running on the web!
//
// The C code is more or less untouched.  I wrote a simple Win32 to tiny-wasm-runtime 2D drawing APIs layer.
// 
// This C code doesn't need to use the twrWasmModuleAsync since all the C functions are Javascript main thread compatible.
// That means they "dont take too long to execute".
// The maze is drawn, then using timer ticks, the maze solve progresses
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { twrWasmModuleAsync } from "tiny-wasm-runtime";
export function mazeRunner() {
    return __awaiter(this, void 0, void 0, function* () {
        const amod = new twrWasmModuleAsync();
        yield amod.loadWasm('maze.wasm');
        //void CalcMaze(HWND hWnd, LONG cell_size, LONG is_black_bg, LONG isd)
        yield amod.executeC(["CalcMaze", 0, 5, 1, 1]);
        yield amod.executeC(["SolveBegin"]);
        let timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            let isdone = yield amod.executeC(["SolveStep", 0]); //SolveStep(hwnd))
            if (isdone)
                clearInterval(timer);
        }), 50);
    });
}
