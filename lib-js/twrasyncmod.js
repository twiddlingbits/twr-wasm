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
import { twrWasmModuleBase } from "./twrmod.js";
import { debugLog } from "./twrdiv.js";
import { twrSharedCircularBuffer } from "./twrcircular.js";
import whatkey from "whatkey";
export class twrWasmAsyncModule extends twrWasmModuleBase {
    constructor(opts) {
        super(new WebAssembly.Memory({ initial: 10, maximum: 100, shared: true }), opts);
        this.init = false;
        //console.log("twrWasmAsyncModule constructor ", crossOriginIsolated);
        this.divKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
        this.canvasKeys = new twrSharedCircularBuffer(); // tsconfig, lib must be set to 2017 or higher
        if (!window.Worker)
            throw new Error("this browser doesn't support web workers.");
        this.myWorker = new Worker(new URL('twrworker.js', import.meta.url), { type: "module" });
        this.myWorker.onmessage = this.processMsg.bind(this);
    }
    loadWasm(urToLoad) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.init)
                throw new Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");
            this.init = true;
            this.malloc = (size) => {
                return this.executeCImpl("twr_wasm_malloc", [size]);
            };
            return new Promise((resolve, reject) => {
                this.loadWasmResolve = resolve;
                this.loadWasmReject = reject;
                if (this.canvas.isvalid())
                    this.myWorker.postMessage(['startup', this.memory, this.divKeys.sharedArray, this.canvasKeys.sharedArray, urToLoad, this.opts, this.canvas.syncGetMetrics()]);
                else
                    this.myWorker.postMessage(['startup', this.memory, this.divKeys.sharedArray, this.canvasKeys.sharedArray, urToLoad, this.opts, undefined]);
            });
        });
    }
    executeC(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const cparams = yield this.convertParams(params); // will also validate params[0]
            return this.executeCImpl(params[0], cparams);
        });
    }
    executeCImpl(fname, cparams = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.executeCResolve = resolve;
                this.executeCReject = reject;
                this.myWorker.postMessage(['executeC', fname, cparams]);
            });
        });
    }
    // this function should be called from HTML "keypress" event from <div>
    keyDownDiv(ev) {
        if (!this.divKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.divKeys");
        this.divKeys.write(whatkey(ev).char.charCodeAt(0));
    }
    // this function should be called from HTML "keypress" event from <canvas>
    keyDownCanvas(ev) {
        if (!this.canvasKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.canvasKeys");
        this.canvasKeys.write(whatkey(ev).char.charCodeAt(0));
    }
    processMsg(event) {
        const msgType = event.data[0];
        const d = event.data[1];
        //console.log("twrWasmAsyncModule - got message: "+event.data)
        switch (msgType) {
            case "divout":
                this.div.charOut(d);
                break;
            case "debug":
                debugLog(d);
                break;
            case "fillrect":
                {
                    const [x, y, w, h, color] = d;
                    if (this.canvas)
                        this.canvas.fillRect(x, y, w, h, color);
                    else
                        console.log('error - msg fillrect received but canvas is undefined.');
                    break;
                }
            case "filltext":
                {
                    const [x, y, ch] = d;
                    if (this.canvas)
                        this.canvas.charOut(x, y, ch);
                    else
                        console.log('error - msg filltext received but canvas is undefined.');
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