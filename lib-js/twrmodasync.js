import { twrDebugLogImpl } from "./twrdebug.js";
import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrWaitingCalls } from "./twrwaitingcalls.js";
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
    myWorker;
    malloc;
    loadWasmResolve;
    loadWasmReject;
    callCResolve;
    callCReject;
    initLW = false;
    waitingcalls;
    constructor(opts) {
        super(opts);
        this.malloc = (size) => { throw new Error("Error - un-init malloc called."); };
        if (!window.Worker)
            throw new Error("This browser doesn't support web workers.");
        this.myWorker = new Worker(new URL('twrmodworker.js', import.meta.url), { type: "module" });
        this.myWorker.onmessage = this.processMsg.bind(this);
    }
    // overrides base implementation
    async loadWasm(pathToLoad) {
        if (this.initLW)
            throw new Error("twrWasmAsyncModule::loadWasm can only be called once per twrWasmAsyncModule instance");
        this.initLW = true;
        return new Promise((resolve, reject) => {
            this.loadWasmResolve = resolve;
            this.loadWasmReject = reject;
            this.malloc = (size) => {
                return this.callCImpl("malloc", [size]);
            };
            this.waitingcalls = new twrWaitingCalls(); // handle's calls that cross the worker thread - main js thread boundary
            let canvas;
            if (this.d2dcanvas.isValid())
                canvas = this.d2dcanvas;
            else
                canvas = this.iocanvas;
            const modWorkerParams = {
                divProxyParams: this.iodiv.getProxyParams(),
                canvasProxyParams: canvas.getProxyParams(),
                waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
            };
            const urlToLoad = new URL(pathToLoad, document.URL);
            const startMsg = { urlToLoad: urlToLoad.href, modWorkerParams: modWorkerParams, modParams: this.modParams };
            this.myWorker.postMessage(['startup', startMsg]);
        });
    }
    async callC(params) {
        const cparams = await this.preCallC(params); // will also validate params[0]
        return this.callCImpl(params[0], cparams);
    }
    async callCImpl(fname, cparams = []) {
        return new Promise((resolve, reject) => {
            this.callCResolve = resolve;
            this.callCReject = reject;
            this.myWorker.postMessage(['callC', fname, cparams]);
        });
    }
    keyEventProcess(ev) {
        if (!ev.isComposing && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
            //console.log("keyDownDiv: ",ev.key, ev.code, ev.key.charCodeAt(0), ev);
            if (ev.key.length == 1)
                return ev.key.charCodeAt(0);
            else if (ev.key == 'Backspace')
                return 8;
            else if (ev.key == 'Enter')
                return 10;
            else {
                console.log("keyDownDiv SKIPPED: ", ev.key, ev.code, ev.key.charCodeAt(0), ev);
            }
        }
        else {
            console.log("keyDownDiv SKIPPED-2: ", ev.key, ev.code, ev.key.charCodeAt(0), ev);
        }
        return undefined;
    }
    // this function should be called from HTML "keydown" event from <div>
    keyDownDiv(ev) {
        if (!this.iodiv || !this.iodiv.divKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.divKeys");
        const r = this.keyEventProcess(ev);
        if (r)
            this.iodiv.divKeys.write(r);
    }
    // this function should be called from HTML "keydown" event from <canvas>
    keyDownCanvas(ev) {
        if (!this.iocanvas || !this.iocanvas.canvasKeys)
            throw new Error("unexpected undefined twrWasmAsyncModule.canvasKeys");
        const r = this.keyEventProcess(ev);
        if (r)
            this.iocanvas.canvasKeys.write(r);
    }
    processMsg(event) {
        const msgType = event.data[0];
        const d = event.data[1];
        //console.log("twrWasmAsyncModule - got message: "+event.data)
        switch (msgType) {
            case "divout":
                const [c, codePage] = d;
                if (this.iodiv.isValid())
                    this.iodiv.charOut(c, codePage);
                else
                    console.log('error - msg divout received but iodiv is undefined.');
                break;
            case "debug":
                twrDebugLogImpl(d);
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
            case "setmemory":
                this.memory = d;
                if (!this.memory)
                    throw new Error("unexpected error - undefined memory in startupOkay msg");
                this.mem8 = new Uint8Array(this.memory.buffer);
                this.mem32 = new Uint32Array(this.memory.buffer);
                this.memD = new Float64Array(this.memory.buffer);
                //console.log("memory set",this.mem8.length);
                break;
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
            case "callCFail":
                if (this.callCReject)
                    this.callCReject(d);
                else
                    throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCReject)");
                break;
            case "callCOkay":
                if (this.callCResolve)
                    this.callCResolve(d);
                else
                    throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCResolve)");
                break;
            default:
                if (!this.waitingcalls)
                    throw new Error("internal error: this.waitingcalls undefined.");
                if (!this.waitingcalls.processMessage(msgType, d))
                    throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: " + msgType);
        }
    }
}
//# sourceMappingURL=twrmodasync.js.map