// The Javascript side of my C maze program 
// My maze code was written along time ago in C for the Amiga, then ported some years later as a Windows screen saver. 
// Now, 20+ years later, running on the web!
//
// The C code is more or less untouched.  I wrote a simple Win32 to twr-wasm 2D drawing APIs layer.
// 
import { twrWasmModuleAsync } from "twr-wasm";
export async function mazeRunner() {
    const amod = new twrWasmModuleAsync();
    await amod.loadWasm('maze.wasm');
    //void CalcMaze(HWND hWnd, LONG cell_size, LONG is_black_bg, LONG isd - slow draw)
    await amod.callC(["CalcMaze", 0, 7, 0, 1]);
    await amod.callC(["SolveBegin"]);
    let timer = setInterval(async () => {
        let isdone = await amod.callC(["SolveStep", 0]); //SolveStep(hwnd))
        if (isdone)
            clearInterval(timer);
    }, 50);
}
//# sourceMappingURL=maze-script.js.map