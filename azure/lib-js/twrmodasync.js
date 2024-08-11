import { twrWasmModuleInJSMain } from "./twrmodjsmain.js";
import { twrWaitingCalls } from "./twrwaitingcalls.js";
import { keyDownUtil } from "./twrcon.js";
import { twrConsoleRegistry } from "./twrconreg.js";
export class twrWasmModuleAsync extends twrWasmModuleInJSMain {
    myWorker;
    malloc;
    loadWasmResolve;
    loadWasmReject;
    callCMap;
    uniqueInt;
    initLW = false;
    waitingcalls;
    // d2dcanvas?:twrCanvas; - defined in twrWasmModuleInJSMain
    // io:{[key:string]: IConsole}; - defined in twrWasmModuleInJSMain
    constructor(opts) {
        super(opts);
        this.callCMap = new Map();
        this.uniqueInt = 1;
        this.malloc = (size) => { throw new Error("Error - un-init malloc called."); };
        if (!window.Worker)
            throw new Error("This browser doesn't support web workers.");
        const url = new URL('twrmodasyncproxy.js', import.meta.url);
        //console.log("url=",url);
        this.myWorker = new Worker(url, { type: "module" });
        this.myWorker.onerror = (event) => {
            console.log("this.myWorker.onerror (undefined message typically means Worker failed to load)");
            console.log("event.message: " + event.message);
            throw event;
        };
        this.myWorker.onmessage = this.processMsg.bind(this);
        this.waitingcalls = new twrWaitingCalls(); // handle's calls that cross the worker thread - main js thread boundary
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
            // conProxyParams will be everything needed to create Proxy versions of all IConsoles, 
            // and create the proxy registry
            let conProxyParams = [];
            for (let i = 0; i < twrConsoleRegistry.consoles.length; i++) {
                conProxyParams.push(twrConsoleRegistry.consoles[i].getProxyParams());
            }
            const allProxyParams = {
                conProxyParams: conProxyParams,
                ioNamesToID: this.ioNamesToID,
                waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
            };
            const urlToLoad = new URL(pathToLoad, document.URL);
            const startMsg = { urlToLoad: urlToLoad.href, allProxyParams: allProxyParams };
            this.myWorker.postMessage(['startup', startMsg]);
        });
    }
    async callC(params) {
        const cparams = await this.preCallC(params); // will also validate params[0]
        const retval = await this.callCImpl(params[0], cparams);
        await this.postCallC(cparams, params);
        return retval;
    }
    async callCImpl(fname, cparams = []) {
        return new Promise((resolve, reject) => {
            const p = {
                callCResolve: resolve,
                callCReject: reject
            };
            this.callCMap.set(++this.uniqueInt, p);
            this.myWorker.postMessage(['callC', this.uniqueInt, fname, cparams]);
        });
    }
    // the API user can call this to default to stdio
    // or the API user can call keyDown on a particular 
    keyDown(ev) {
        keyDownUtil(this.io.stdio, ev);
    }
    // this function is deprecated and here for backward compatibility
    keyDownDiv(ev) {
        if (this.io.stdio.element && this.io.stdio.element.id == "twr_iodiv")
            this.keyDown(ev);
        else
            throw new Error("keyDownDiv is deprecated, but in any case should only be used with twr_iodiv");
    }
    // this function is deprecated and here for backward compatibility
    keyDownCanvas(ev) {
        if (this.io.stdio.element && this.io.stdio.element.id == "twr_iocanvas")
            this.keyDown(ev);
        else
            throw new Error("keyDownCanvas is deprecated, but in any case should only be used with twr_iocanvas");
    }
    processMsg(event) {
        const [msgType, ...params] = event.data;
        const d = params[0];
        //console.log("twrWasmAsyncModule - got message: "+event.data)
        switch (msgType) {
            case "setmemory":
                this.memory = d;
                if (!this.memory)
                    throw new Error("unexpected error - undefined memory");
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
                {
                    const [id, returnCode] = params;
                    const p = this.callCMap.get(id);
                    if (!p)
                        throw new Error("internal error");
                    this.callCMap.delete(id);
                    if (p.callCReject)
                        p.callCReject(returnCode);
                    else
                        throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCReject)");
                }
                break;
            case "callCOkay":
                {
                    const [id, returnCode] = params;
                    const p = this.callCMap.get(id);
                    if (!p)
                        throw new Error("internal error");
                    this.callCMap.delete(id);
                    if (p.callCResolve)
                        p.callCResolve(returnCode);
                    else
                        throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCResolve)");
                    break;
                }
            default:
                if (!this.waitingcalls)
                    throw new Error("internal error: this.waitingcalls undefined.");
                if (this.waitingcalls.processMessage(msgType, d))
                    break;
                // here if a console  message
                // console messages are an array with the first entry as the console ID
                const con = twrConsoleRegistry.getConsole(d[0]);
                if (con.processMessage(msgType, d, this))
                    break;
                throw new Error("twrWasmAsyncModule - unknown and unexpected msgType: " + msgType);
        }
    }
}
//# sourceMappingURL=twrmodasync.js.map