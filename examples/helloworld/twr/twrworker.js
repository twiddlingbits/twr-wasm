//
// this script is the WebWorker thead used by class twrWasmAsyncModule
//
import { twrWasmModule } from "./twrmod.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
let stdoutKeys;
let canvasKeys;
let canvasTextMetrics;
let mod = new twrWasmModule;
onmessage = function (e) {
    console.log('twrworker.js: message received from main script: ' + e.data);
    if (e.data[0] == 'startup') {
        stdoutKeys = new twrSharedCircularBuffer(e.data[1]);
        canvasKeys = new twrSharedCircularBuffer(e.data[2]);
        const wasmFile = e.data[3];
        let opts = e.data[4];
        canvasTextMetrics = e.data[5];
        const myimports = {
            twrStdout: proxyStdout,
            twrDebugLog: proxyDebugLog,
            twrStdin: proxStdin,
            twrCanvasin: proxyCanvasin,
            twrCanvasInkey: proxyCanvasInkey,
            twrCanvasGetAvgCharWidth: proxyCanvasGetAvgCharWidth,
            twrCanvasGetCharHeight: proxyCanvasGetCharHeight,
            twrCanvasGetColorWhite: proxyCanvasGetColorWhite,
            twrCanvasGetColorBlack: proxyCanvasGetColorBlack,
            twrCanvasFillRect: proxyCanvasFillRect,
            twrCanvasCharOut: proxyCanvasCharOut,
        };
        opts = Object.assign(Object.assign({ printf: "debugcon" }, opts), { imports: myimports });
        mod.loadWasm(wasmFile, opts).then(() => {
            postMessage(["startupOkay"]);
        }).catch((ex) => {
            console.log(".catch: ", ex);
            postMessage(["startupFail", ex]);
        });
    }
    else if (e.data[0] == 'executeC') {
        mod.executeC(e.data[1]).then((rc) => {
            postMessage(["executeCOkay", rc]);
        }).catch(e => {
            console.log("exception in executeC twrworker.js\n");
            console.log(e);
            postMessage(["executeCFail", e]);
        });
    }
    else {
        console.log("twrworker.js: unknown message: " + e);
    }
};
// ************************************************************************
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
// iostd.c
// ************************************************************************
function proxyStdout(ch) {
    postMessage(["stdout", ch]);
}
function proxStdin() {
    return stdoutKeys.readWait(); // wait for a key, then read it
}
// ************************************************************************
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
// iodebug.c
// ************************************************************************
function proxyDebugLog(ch) {
    postMessage(["debugcon", ch]);
}
// ************************************************************************
// These are the WebAssembly.ModuleImports that the twr_wasm_* C code calls
// iowindow.c
// ************************************************************************
function proxyCanvasin() {
    //ctx.commit(); not avail in chrome
    postMessage(["debugcon", 'x']);
    return canvasKeys.readWait(); // wait for a key, then read it
}
function proxyCanvasInkey() {
    if (canvasKeys.isEmpty())
        return 0;
    else
        return proxyCanvasin();
}
function proxyCanvasGetAvgCharWidth() {
    return canvasTextMetrics.charWidth;
}
function proxyCanvasGetCharHeight() {
    return canvasTextMetrics.charHeight;
}
function proxyCanvasGetColorWhite() {
    return canvasTextMetrics.white;
}
function proxyCanvasGetColorBlack() {
    return canvasTextMetrics.black;
}
function proxyCanvasFillRect(x, y, w, h, color) {
    postMessage(["fillrect", [x, y, w, h, color]]);
}
function proxyCanvasCharOut(x, y, ch) {
    postMessage(["filltext", [x, y, ch]]);
}
//# sourceMappingURL=twrworker.js.map