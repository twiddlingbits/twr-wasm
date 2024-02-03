//
// This module provides an asynchronous version of the twrWasmModule's primary functions:
//   - async LoadWasm(...) - load a wasm module
//   - async executeC(...) - execute a C function exported from the module
//
// This class proxies through  WebWorker thread, where the wasm module is loaded and C functions are also executed.
// This allows you to execute C functions that block for long periods of time, while allowing the Main Javascript thread to not block.
// This allows you to execute C functions that use a single main loop, as opposed to an event driven architecture.
// If the C function waits for input (via stdin), it will put the WebWorker thread to sleep, conserving CPU cycles.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { syncCharToStdout, syncDebugLog } from "./twrdiv.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
import { twrCanvas } from "./twrcanvas.js";
export class twrWasmAsyncModule {
    constructor() {
        this.init = false;
        this.stdinKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
        this.canvasKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
        if (!window.Worker)
            throw new Error("this browser doesn't support web workers.");
        const element = document.getElementById("twr_canvas");
        this.canvas = new twrCanvas(element);
        this.myWorker = new Worker("./out/twrworker.js", { type: "module" });
        this.myWorker.onmessage = this.processMsg.bind(this);
    }
    // async loadWasm does not support all IloadWasmOpts options.
    loadWasm(urToLoad, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.init)
                throw new Error("loadWasm can only be called once per twrWasmAsyncModule instance");
            this.init = true;
            return new Promise((resolve, reject) => {
                this.loadWasmResolve = resolve;
                this.loadWasmReject = reject;
                if (this.canvas)
                    this.myWorker.postMessage(['startup', this.stdinKeys.sharedArray, this.canvasKeys.sharedArray, urToLoad, opts, this.canvas.syncGetMetrics()]);
                else
                    this.myWorker.postMessage(['startup', this.stdinKeys.sharedArray, this.canvasKeys.sharedArray, urToLoad, opts, undefined]);
            });
        });
    }
    executeC(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.executeCResolve = resolve;
                this.executeCReject = reject;
                this.myWorker.postMessage(['executeC', params]);
            });
        });
    }
    // this function should be called from HTML "keypress" event from <div>
    keyDownStdin(charcode) {
        if (!this.stdinKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.stdoutKeys");
        this.stdinKeys.write(charcode);
    }
    // this function should be called from HTML "keypress" event from <canvas>
    keyDownCanvasin(charcode) {
        if (!this.canvasKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.canvasKeys");
        this.canvasKeys.write(charcode);
    }
    processMsg(event) {
        const msgType = event.data[0];
        const d = event.data[1];
        //console.log("twrWasmAsyncModule - got message: "+event.data)
        switch (msgType) {
            case "stdout":
                syncCharToStdout(d);
                break;
            case "debugcon":
                syncDebugLog(d);
                break;
            case "fillrect":
                {
                    const [x, y, w, h, color] = d;
                    this.canvas.fillRect(x, y, w, h, color);
                    break;
                }
            case "filltext":
                {
                    const [x, y, ch] = d;
                    this.canvas.charOut(x, y, ch);
                    break;
                }
                ;
            case "startupFail":
                if (this.loadWasmReject)
                    this.loadWasmReject(d);
                else
                    throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmReject)");
                break;
            case "startupOkay":
                if (this.loadWasmResolve)
                    this.loadWasmResolve(undefined);
                else
                    throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined loadWasmResolve)");
                break;
            case "executeCFail":
                if (this.executeCReject)
                    this.executeCReject(d);
                else
                    throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined executeCReject)");
                break;
            case "executeCOkay":
                if (this.executeCResolve)
                    this.executeCResolve(d);
                else
                    throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined executeCResolve)");
                break;
            default:
                throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: " + msgType);
        }
    }
}
//# sourceMappingURL=twrasyncmod.js.map