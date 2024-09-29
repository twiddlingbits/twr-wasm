import { logToCon } from "./twrcon.js";
import { parseModOptions } from './twrmodutil.js';
import { twrWasmMemoryAsync } from "./twrwasmmem.js";
import { twrWasmModuleCallAsync } from "./twrwasmcall.js";
import { twrLibraryInstanceRegistry } from "./twrlibrary.js";
import { twrEventQueueSend } from "./twreventqueue.js";
import { twrLibBuiltIns } from "./twrlibbuiltin.js";
export class twrWasmModuleAsync {
    myWorker;
    loadWasmResolve;
    loadWasmReject;
    callCMap;
    uniqueInt;
    initLW = false;
    io;
    ioNamesToID;
    wasmMem;
    callCInstance;
    eventQueueSend = new twrEventQueueSend;
    isTwrWasmModuleAsync = true;
    // divLog is deprecated.  Use IConsole.putStr or log
    divLog;
    log;
    // IWasmMemory
    // These are deprecated, use wasmMem instead.
    memory;
    exports;
    mem8;
    mem32;
    memD;
    stringToU8;
    copyString;
    getLong;
    setLong;
    getDouble;
    setDouble;
    getShort;
    getString;
    getU8Arr;
    getU32Arr;
    malloc;
    free;
    putString;
    putU8;
    putArrayBuffer;
    constructor(opts) {
        [this.io, this.ioNamesToID] = parseModOptions(opts);
        this.callCMap = new Map();
        this.uniqueInt = 1;
        if (!window.Worker)
            throw new Error("This browser doesn't support web workers.");
        const url = new URL('twrmodasyncproxy.js', import.meta.url);
        this.myWorker = new Worker(url, { type: "module" });
        this.myWorker.onerror = (event) => {
            console.log("this.myWorker.onerror (undefined message typically means Worker failed to load)");
            console.log("event.message: " + event.message);
            throw event;
        };
        this.myWorker.onmessage = this.processMsg.bind(this);
        this.log = logToCon.bind(undefined, this.io.stdio);
        this.divLog = this.log;
    }
    async loadWasm(pathToLoad) {
        if (this.initLW)
            throw new Error("twrWasmModuleAsync::loadWasm can only be called once per instance");
        this.initLW = true;
        // load builtin libraries
        await twrLibBuiltIns();
        return new Promise((resolve, reject) => {
            this.loadWasmResolve = resolve;
            this.loadWasmReject = reject;
            // libProxyParams will be everything needed to create Proxy versions of all twrLibraries
            // libClassInstances has one entry per class, even if multiple instances of same class are registered (ie, interfaceName set)
            let libProxyParams = [];
            for (let i = 0; i < twrLibraryInstanceRegistry.libInterfaceInstances.length; i++) {
                libProxyParams.push(twrLibraryInstanceRegistry.libInterfaceInstances[i].getProxyParams());
            }
            const allProxyParams = {
                libProxyParams: libProxyParams,
                ioNamesToID: this.ioNamesToID, // console instance name mappings
                eventQueueBuffer: this.eventQueueSend.circBuffer.saBuffer
            };
            const urlToLoad = new URL(pathToLoad, document.URL);
            const startMsg = { urlToLoad: urlToLoad.href, allProxyParams: allProxyParams };
            this.myWorker.postMessage(['startup', startMsg]);
        });
    }
    postEvent(eventID, ...params) {
        this.eventQueueSend.postEvent(eventID, ...params);
        this.myWorker.postMessage(['tickleEventLoop']);
    }
    async callC(params) {
        const cparams = await this.callCInstance.preCallC(params); // will also validate params[0]
        const retval = await this.callCImpl(params[0], cparams);
        await this.callCInstance.postCallC(cparams, params);
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
    // this implementation piggybacks of callCImpl -- it is essentially a specific version of callC
    // instead of sending a message to the twrWasmModuleAsync thread (as callCImpl does), we post a malloc command
    // in the eventQueue.  This allows it to be processed  by the twrWasmModuleAsync event loop.  malloc was previously sent using callCImpl, but 
    // callCImpl uses postMessage, and the twrWasmModuleAsync thread will not process the callCImpl message while inside another callC,
    // and malloc may be used by wasmMem.putXX functions, inside twrWasmLibrary derived classes, which are called from C, inside of a callC.
    //
    async mallocImpl(size) {
        return new Promise((resolve, reject) => {
            const p = {
                callCResolve: resolve,
                callCReject: reject
            };
            this.callCMap.set(++this.uniqueInt, p);
            this.eventQueueSend.postMalloc(this.uniqueInt, size);
            this.myWorker.postMessage(['tickleEventLoop']);
        });
    }
    // the API user can call this to default to stdio
    // or the API user can call keyDown on a particular console
    keyDown(ev) {
        if (!this.io.stdio)
            throw new Error("internal error - stdio not defined");
        if (!this.io.stdio.keyDown)
            throw new Error("stdio.keyDown not defined. Console must implemented IConsoleStreamIn.");
        this.io.stdio.keyDown(ev);
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
    //  this.myWorker.onmessage = this.processMsg.bind(this);
    async processMsg(event) {
        const msg = event.data;
        const [msgClass, id] = msg;
        //console.log("twrWasmAsyncModule - got message: "+event.data)
        if (msgClass === "twrWasmModule") {
            const [, , msgType, ...params] = msg;
            switch (msgType) {
                case "setmemory":
                    this.memory = params[0];
                    if (!this.memory)
                        throw new Error("unexpected error - undefined memory");
                    this.wasmMem = new twrWasmMemoryAsync(this.memory, this.mallocImpl.bind(this), this.callCImpl.bind(this));
                    this.callCInstance = new twrWasmModuleCallAsync(this.wasmMem, this.callCImpl.bind(this));
                    // backwards compatible
                    this.mem8 = this.wasmMem.mem8;
                    this.mem32 = this.wasmMem.mem32;
                    this.memD = this.wasmMem.memD;
                    this.stringToU8 = this.wasmMem.stringToU8;
                    this.copyString = this.wasmMem.copyString;
                    this.getLong = this.wasmMem.getLong;
                    this.setLong = this.wasmMem.setLong;
                    this.getDouble = this.wasmMem.getDouble;
                    this.setDouble = this.wasmMem.setDouble;
                    this.getShort = this.wasmMem.getShort;
                    this.getString = this.wasmMem.getString;
                    this.getU8Arr = this.wasmMem.getU8Arr;
                    this.getU32Arr = this.wasmMem.getU32Arr;
                    this.malloc = this.wasmMem.malloc;
                    this.free = this.wasmMem.free;
                    this.putString = this.wasmMem.putString;
                    this.putU8 = this.wasmMem.putU8;
                    this.putArrayBuffer = this.wasmMem.putArrayBuffer;
                    break;
                case "startupFail":
                    const [returnCode] = params;
                    if (this.loadWasmReject)
                        this.loadWasmReject(returnCode);
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
                        const [returnCode] = params;
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
                        const [returnCode] = params;
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
                    throw new Error("internal error: " + msgType);
            }
        }
        else if (msgClass === "twrLibrary") {
            const lib = twrLibraryInstanceRegistry.getLibraryInstance(id);
            const msgLib = msg;
            await lib.processMessageFromProxy(msg, this);
        }
        else {
            throw new Error("twrWasmAsyncModule - unknown and unexpected msgClass: " + msgClass);
        }
    }
    // given a url, load its contents, and stuff into Wasm memory similar to Unint8Array
    async fetchAndPutURL(fnin) {
        if (!(typeof fnin === 'object' && fnin instanceof URL))
            throw new Error("fetchAndPutURL param must be URL");
        try {
            let response = await fetch(fnin);
            let buffer = await response.arrayBuffer();
            let src = new Uint8Array(buffer);
            let dest = await this.wasmMem.putU8(src);
            return [dest, src.length];
        }
        catch (err) {
            console.log('fetchAndPutURL Error. URL: ' + fnin + '\n' + err + (err.stack ? "\n" + err.stack : ''));
            throw err;
        }
    }
}
//# sourceMappingURL=twrmodasync.js.map