// this script is the WebWorker thead used by class twrWasmAsyncModule
import { twrCanvasProxy } from "./twrcanvas.js";
import { twrDivProxy } from "./twrdiv.js";
import { twrDebugLogProxy } from "./twrdebug.js";
import { twrWasmModuleBase } from "./twrmodbase.js";
import { twrWaitingCallsProxy } from "./twrwaitingcalls.js";
import { twrTimeEpochImpl } from "./twrdate.js";
import { twrTimeTmLocalImpl, twrUserLconvImpl, twrUserLanguageImpl, twrRegExpTest1252Impl, twrToLower1252Impl, twrToUpper1252Impl, twrStrcollImpl } from "./twrlocale.js";
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
    else if (e.data[0] == 'callC') {
        mod.callCImpl(e.data[1], e.data[2]).then((rc) => {
            postMessage(["callCOkay", rc]);
        }).catch(e => {
            console.log("exception in callC twrworker.js\n");
            console.log(e);
            postMessage(["callCFail", e]);
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
            twrTimeEpoch: twrTimeEpochImpl,
            twrTimeTmLocal: twrTimeTmLocalImpl.bind(this),
            twrUserLconv: twrUserLconvImpl.bind(this),
            twrUserLanguage: twrUserLanguageImpl.bind(this),
            twrRegExpTest1252: twrRegExpTest1252Impl.bind(this),
            twrToLower1252: twrToLower1252Impl.bind(this),
            twrToUpper1252: twrToUpper1252Impl.bind(this),
            twrStrcoll: twrStrcollImpl.bind(this),
            twrSleep: waitingCallsProxy.sleep.bind(waitingCallsProxy),
            twrDivCharOut: divProxy.charOut.bind(divProxy),
            twrDivCharIn: divProxy.charIn.bind(divProxy),
            twrCanvasCharIn: canvasProxy.charIn.bind(canvasProxy),
            twrCanvasInkey: canvasProxy.inkey.bind(canvasProxy),
            twrCanvasGetProp: canvasProxy.getProp.bind(canvasProxy),
            twrCanvasDrawSeq: canvasProxy.drawSeq.bind(canvasProxy),
            twrSin: Math.sin,
            twrCos: Math.cos,
            twrTan: Math.tan,
            twrFAbs: Math.abs,
            twrACos: Math.acos,
            twrASin: Math.asin,
            twrATan: Math.atan,
            twrExp: Math.exp,
            twrFloor: Math.floor,
            twrCeil: Math.ceil,
            twrFMod: function (x, y) { return x % y; },
            twrLog: Math.log,
            twrPow: Math.pow,
            twrSqrt: Math.sqrt,
            twrTrunc: Math.trunc,
            twrDtoa: this.floatUtil.dtoa.bind(this.floatUtil),
            twrToFixed: this.floatUtil.toFixed.bind(this.floatUtil),
            twrToExponential: this.floatUtil.toExponential.bind(this.floatUtil),
            twrAtod: this.floatUtil.atod.bind(this.floatUtil),
            twrFcvtS: this.floatUtil.fcvtS.bind(this.floatUtil)
        };
    }
}
//# sourceMappingURL=twrmodworker.js.map