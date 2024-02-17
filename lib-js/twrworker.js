//
// this script is the WebWorker thead used by class twrWasmAsyncModule
//
import { twrCanvasProxy } from "./twrcanvas.js";
import { twrDivProxy } from "./twrdiv.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
let divKeys;
let mod;
onmessage = function (e) {
    //console.log('twrworker.js: message received from main script: '+e.data);
    if (e.data[0] == 'startup') {
        const params = e.data[1];
        mod = new twrWasmModuleInWorker(params.modParams, params.modWorkerParams);
        mod.loadWasm(params.urlToLoad).then(() => {
            postMessage(["startupOkay"]);
        }).catch((ex) => {
            console.log(".catch: ", ex);
            postMessage(["startupFail", ex]);
        });
    }
    else if (e.data[0] == 'executeC') {
        mod.executeCImpl(e.data[1], e.data[2]).then((rc) => {
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
function proxyDebugLog(ch) {
    postMessage(["debug", ch]);
}
// ************************************************************************
class twrWasmModuleInWorker extends twrWasmModuleBase {
    constructor(modParams, modInWorkerParams) {
        super();
        this.memory = modInWorkerParams.memory;
        this.mem8 = new Uint8Array(this.memory.buffer);
        this.malloc = (size) => { throw new Error("error - un-init malloc called"); };
        this.modParams = modParams;
        const canvasProxy = new twrCanvasProxy(modInWorkerParams.canvasProxyParams, this);
        const divProxy = new twrDivProxy(modInWorkerParams.divProxyParams);
        this.modParams.imports = {
            twrDebugLog: proxyDebugLog,
            twrDivCharOut: divProxy.charOut.bind(divProxy),
            twrDivCharIn: divProxy.charIn.bind(divProxy),
            twrCanvasCharIn: canvasProxy.charIn.bind(canvasProxy),
            twrCanvasInkey: canvasProxy.inkey.bind(canvasProxy),
            twrCanvasGetProp: canvasProxy.getProp.bind(canvasProxy),
            twrCanvasDrawSeq: canvasProxy.drawSeq.bind(canvasProxy)
        };
    }
    null() {
        console.log("warning - call to unimplemented twrXXX import in twrWasmModuleWorker");
    }
}
//# sourceMappingURL=twrworker.js.map