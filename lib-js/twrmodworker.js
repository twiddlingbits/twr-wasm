//
// this script is the WebWorker thead used by class twrWasmAsyncModule
//
import { twrCanvasProxy } from "./twrcanvas.js";
import { twrDivProxy } from "./twrdiv.js";
import { twrDebugLogProxy } from "./twrdebug.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
import { twrWaitingCallsProxy } from "./twrwaitingcalls.js";
let mod;
onmessage = function (e) {
    //console.log('twrworker.js: message received from main script: '+e.data);
    if (e.data[0] == 'startup') {
        const params = e.data[1];
        //console.log("Worker startup params:",params);
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
class twrWasmModuleInWorker extends twrWasmModuleBase {
    malloc;
    modParams;
    constructor(modParams, modInWorkerParams) {
        super();
        this.isWorker = true;
        this.malloc = (size) => { throw new Error("error - un-init malloc called"); };
        this.modParams = modParams;
        //console.log("twrWasmModuleInWorker: ", modInWorkerParams.canvasProxyParams)
        const canvasProxy = new twrCanvasProxy(modInWorkerParams.canvasProxyParams, this);
        const divProxy = new twrDivProxy(modInWorkerParams.divProxyParams);
        const waitingCallsProxy = new twrWaitingCallsProxy(modInWorkerParams.waitingCallsProxyParams);
        this.modParams.imports = {
            twrDebugLog: twrDebugLogProxy,
            twrSleep: waitingCallsProxy.sleep.bind(waitingCallsProxy),
            twrTime: waitingCallsProxy.time.bind(waitingCallsProxy),
            twrDivCharOut: divProxy.charOut.bind(divProxy),
            twrDivCharIn: divProxy.charIn.bind(divProxy),
            twrCanvasCharIn: canvasProxy.charIn.bind(canvasProxy),
            twrCanvasInkey: canvasProxy.inkey.bind(canvasProxy),
            twrCanvasGetProp: canvasProxy.getProp.bind(canvasProxy),
            twrCanvasDrawSeq: canvasProxy.drawSeq.bind(canvasProxy),
            twrSin: Math.sin,
            twrCos: Math.cos,
        };
    }
}
//# sourceMappingURL=twrmodworker.js.map