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
import { debugLogImpl } from "./twrdebug.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrWaitingCalls } from "./twrwaitingcalls.js";
import whatkey from "whatkey";
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
    constructor(opts) {
        super(opts);
        this.initLW = false;
        this.memory = new WebAssembly.Memory({ initial: 10, maximum: 100, shared: true });
        this.mem8 = new Uint8Array(this.memory.buffer);
        this.malloc = (size) => { throw new Error("Error - un-init malloc called."); };
        if (!window.Worker)
            throw new Error("This browser doesn't support web workers.");
        this.myWorker = new Worker(new URL('twrmodworker.js', import.meta.url), { type: "module" });
        this.myWorker.onmessage = this.processMsg.bind(this);
    }
    loadWasm(fileToLoad) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initLW)
                throw new Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");
            this.initLW = true;
            return new Promise((resolve, reject) => {
                this.loadWasmResolve = resolve;
                this.loadWasmReject = reject;
                this.malloc = (size) => {
                    return this.executeCImpl("twr_malloc", [size]);
                };
                this.waitingcalls = new twrWaitingCalls(); // calls int JS Main that block and wait for a result
                let canvas;
                if (this.d2dcanvas.isValid())
                    canvas = this.d2dcanvas;
                else
                    canvas = this.iocanvas;
                const modWorkerParams = {
                    memory: this.memory,
                    divProxyParams: this.iodiv.getProxyParams(),
                    canvasProxyParams: canvas.getProxyParams(),
                    waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
                };
                const startMsg = { fileToLoad: fileToLoad, modWorkerParams: modWorkerParams, modParams: this.modParams };
                this.myWorker.postMessage(['startup', startMsg]);
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
    // this function should be called from HTML "keydown" event from <div>
    keyDownDiv(ev) {
        if (!this.iodiv || !this.iodiv.divKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.divKeys");
        this.iodiv.divKeys.write(whatkey(ev).char.charCodeAt(0));
    }
    // this function should be called from HTML "keydown" event from <canvas>
    keyDownCanvas(ev) {
        if (!this.iocanvas || !this.iocanvas.canvasKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.canvasKeys");
        this.iocanvas.canvasKeys.write(whatkey(ev).char.charCodeAt(0));
    }
    processMsg(event) {
        const msgType = event.data[0];
        const d = event.data[1];
        //console.log("twrWasmAsyncModule - got message: "+event.data)
        switch (msgType) {
            case "divout":
                if (this.iodiv.isValid())
                    this.iodiv.charOut(d);
                else
                    console.log('error - msg divout received but iodiv is undefined.');
                break;
            case "debug":
                debugLogImpl(d);
                break;
            case "sleep":
                if (!this.waitingcalls)
                    throw new Error("msg sleep received but this.waitingcalls undefined.");
                const [ms] = d;
                this.waitingcalls.startSleep(ms);
                break;
            case "drawseq":
                {
                    //console.log("twrModAsync got message drawseq");
                    const [ds] = d;
                    if (this.iocanvas.isValid())
                        this.iocanvas.drawSeq(ds);
                    else if (this.d2dcanvas.isValid())
                        this.d2dcanvas.drawSeq(ds);
                    else
                        throw new Error('msg drawseq received but canvas is undefined.');
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
//# sourceMappingURL=twrmodasync.js.map