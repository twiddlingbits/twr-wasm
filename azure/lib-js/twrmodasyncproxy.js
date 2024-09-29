import { twrWasmBase } from "./twrwasmbase.js";
import { twrLibraryProxy, twrLibraryInstanceProxyRegistry } from "./twrlibrary.js";
import { twrEventQueueReceive } from "./twreventqueue.js";
let mod;
self.onmessage = function (e) {
    //console.log('twrworker.js: message received from main script: '+e.data);
    const [msgType, ...params] = e.data;
    if (msgType === 'startup') {
        const [startMsg] = params;
        //console.log("Worker startup params:",params);
        mod = new twrWasmModuleAsyncProxy(startMsg.allProxyParams);
        mod.loadWasm(startMsg.urlToLoad).then(() => {
            postMessage(["twrWasmModule", undefined, "startupOkay"]);
        }).catch((ex) => {
            console.log(".catch: ", ex);
            postMessage(["twrWasmModule", undefined, "startupFail", ex]);
        });
    }
    else if (msgType === 'callC') {
        const [callcID, funcName, cparams] = params;
        try {
            const rc = mod.wasmCall.callCImpl(funcName, cparams);
            postMessage(["twrWasmModule", callcID, "callCOkay", rc]);
        }
        catch (ex) {
            console.log("exception in callC in 'twrmodasyncproxy.js': \n", params);
            console.log(ex);
            postMessage(["twrWasmModule", callcID, "callCFail", ex]);
        }
    }
    else if (msgType === 'tickleEventLoop') {
        mod.eventQueueReceive.processIncomingCommands();
    }
    else {
        console.log("twrmodasyncproxy.js: unknown message: " + e);
    }
};
// ************************************************************************
export class twrWasmModuleAsyncProxy extends twrWasmBase {
    allProxyParams;
    ioNamesToID;
    libimports = {};
    eventQueueReceive;
    constructor(allProxyParams) {
        super();
        this.allProxyParams = allProxyParams;
        this.ioNamesToID = allProxyParams.ioNamesToID;
        this.eventQueueReceive = new twrEventQueueReceive(this, allProxyParams.eventQueueBuffer);
    }
    async loadWasm(pathToLoad) {
        // create twrLibraryProxy versions for each twrLibrary
        for (let i = 0; i < this.allProxyParams.libProxyParams.length; i++) {
            const params = this.allProxyParams.libProxyParams[i];
            const lib = new twrLibraryProxy(params);
            // TODO!! This registry isn't actually being used (yet)?
            twrLibraryInstanceProxyRegistry.registerProxy(lib);
            this.libimports = { ...this.libimports, ...await lib.getProxyImports(this) };
        }
        const twrConGetIDFromNameImpl = (nameIdx) => {
            const name = this.wasmMem.getString(nameIdx);
            const id = this.ioNamesToID[name];
            if (id)
                return id;
            else
                return -1;
        };
        const imports = {
            ...this.libimports,
            twrConGetIDFromName: twrConGetIDFromNameImpl,
        };
        await super.loadWasm(pathToLoad, imports);
        // SharedArrayBuffer required for twrWasmModuleAsync/twrWasmModuleAsyncProxy
        // instanceof SharedArrayBuffer doesn't work when crossOriginIsolated not enable, and will cause a runtime error
        // (don't check for instanceof SharedArrayBuffer, since it can cause an runtime error when SharedArrayBuffer does not exist)
        if (this.wasmMem.memory.buffer instanceof ArrayBuffer)
            throw new Error("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)");
        else
            postMessage(["twrWasmModule", undefined, "setmemory", this.wasmMem.memory]);
        // init C runtime
        const init = this.exports.twr_wasm_init;
        init(this.ioNamesToID.stdio, this.ioNamesToID.stderr, this.ioNamesToID.std2d == undefined ? -1 : this.ioNamesToID.std2d, this.wasmMem.mem8.length);
    }
}
//# sourceMappingURL=twrmodasyncproxy.js.map