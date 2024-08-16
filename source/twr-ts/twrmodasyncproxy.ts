import {TModAsyncProxyStartupMsg} from "./twrmodasync.js"
import {twrWasmBase} from "./twrwasmbase.js"
import {twrTimeEpochImpl} from "./twrdate.js"
import {twrTimeTmLocalImpl, twrUserLconvImpl, twrUserLanguageImpl, twrRegExpTest1252Impl,twrToLower1252Impl, twrToUpper1252Impl} from "./twrlocale.js"
import {twrStrcollImpl, twrUnicodeCodePointToCodePageImpl, twrCodePageToUnicodeCodePoint, twrGetDtnamesImpl} from "./twrlocale.js"
import {twrConsoleDivProxy} from "./twrcondiv.js";
import {twrWaitingCallsProxy, TWaitingCallsProxyParams} from "./twrwaitingcalls.js";
import {IConsoleProxy, TConsoleProxyParams} from "./twrcon.js"
import {twrConsoleCanvasProxy} from "./twrconcanvas.js";
import {twrConsoleDebugProxy} from "./twrcondebug.js"
import {twrConsoleTerminalProxy} from "./twrconterm.js"
import {twrConsoleProxyRegistry} from "./twrconreg.js"
import {twrFloatUtil} from "./twrfloat.js"
import {TLibraryProxyParams, twrLibraryProxy, twrLibraryInstanceProxyRegistry} from "./twrlibrary.js"

export type TModAsyncMessage=[msgClass:string, id:number, msgType:string, ...params:any[]];

export interface IAllProxyParams {
   conProxyParams: TConsoleProxyParams[],  // everything needed to create matching IConsoleProxy for each IConsole and twrConsoleProxyRegistry
   libProxyParams: TLibraryProxyParams[], 
   ioNamesToID: {[key:string]: number},  // name to id mappings for this module
   waitingCallsProxyParams:TWaitingCallsProxyParams,
}

let mod:twrWasmModuleAsyncProxy;

self.onmessage = function(e) {
    //console.log('twrworker.js: message received from main script: '+e.data);

    if (e.data[0]=='startup') {
        const params:TModAsyncProxyStartupMsg=e.data[1];
        //console.log("Worker startup params:",params);
        mod=new twrWasmModuleAsyncProxy(params.allProxyParams);

        mod.loadWasm(params.urlToLoad).then( ()=> {
            postMessage(["twrWasmModule", undefined, "startupOkay"]);
        }).catch( (ex)=> {
            console.log(".catch: ", ex);
            postMessage(["twrWasmModule", undefined, "startupFail", ex]);
        });
    }
    else if (e.data[0]=='callC') {
         const [msg, callcID, funcName, cparams]=e.data;
         try {
            const rc=mod.callCInstance.callCImpl(funcName, cparams);
            postMessage(["twrWasmModule", callcID, "callCOkay", rc]);
         }
         catch(ex: any) {
            console.log("exception in callC in 'twrmodasyncproxy.js': \n", e.data[1], e.data[2]);
            console.log(ex);
            postMessage(["twrWasmModule", callcID, "callCFail", ex]);
        }
    }
    else {
        console.log("twrmodasyncproxy.js: unknown message: "+e);
    }
}

// ************************************************************************

export class twrWasmModuleAsyncProxy extends twrWasmBase {
   cpTranslate:twrCodePageToUnicodeCodePoint;
   allProxyParams:IAllProxyParams;
   ioNamesToID: {[key: string]: number};
   libimports:WebAssembly.ModuleImports ={};

   constructor(allProxyParams:IAllProxyParams) {
      super();
      this.allProxyParams=allProxyParams;
      this.cpTranslate=new twrCodePageToUnicodeCodePoint();
      this.ioNamesToID=allProxyParams.ioNamesToID;

      // create IConsoleProxy versions of each IConsole
      for (let i=0; i<allProxyParams.conProxyParams.length; i++) {
         const params=allProxyParams.conProxyParams[i];
         const con:IConsoleProxy = this.getProxyInstance(params);
         twrConsoleProxyRegistry.registerConsoleProxy(con)
      }

      // TODO!! These are very similar to consoles, unify them?
        // create twrLibraryProxy versions of each twrLibrary
        for (let i=0; i<allProxyParams.libProxyParams.length; i++) {
         const params=allProxyParams.libProxyParams[i];
         const lib = new twrLibraryProxy(params);
         // TODO!! This registry isn't actually being used (yet)?
         twrLibraryInstanceProxyRegistry.registerProxy(lib)
         this.libimports={...this.libimports, ...lib.getProxyImports(this)};
      }   
   }
         
   private getProxyInstance(params:TConsoleProxyParams): IConsoleProxy {

      const className=params[0];
      switch (className) {
         case "twrConsoleDivProxy":
             return new twrConsoleDivProxy(params);

         case "twrConsoleTerminalProxy":
            return new twrConsoleTerminalProxy(params);

         case "twrConsoleDebugProxy":
            return new twrConsoleDebugProxy(params);

         case "twrConsoleCanvasProxy":
            return new twrConsoleCanvasProxy(params);

         default:
            throw new Error("Unknown class name passed to getProxyClassConstructor: "+className);
      }
   }


   async loadWasm(pathToLoad: string): Promise<void> {
      
      const waitingCallsProxy = new twrWaitingCallsProxy(this.allProxyParams.waitingCallsProxyParams);

      const conProxyCall = (funcName: keyof IConsoleProxy, jsid:number, ...args: any[]):any => {
         const con=twrConsoleProxyRegistry.getConsoleProxy(jsid);
         const f=con[funcName] as (...args: any[]) => any;
         if (!f) throw new Error(`Likely using an incorrect console type. jsid=${jsid}, funcName=${funcName}`);
         return f.call(con, ...args);
      }

      const conSetRange = (jsid:number, chars:number, start:number, len:number) => {
         let values=[];
         for (let i=start; i<start+len; i++) {
            values.push(this.wasmMem.getLong(i));
         }
         conProxyCall("setRange", jsid, start, values);
      }

      const conPutStr = (jsid:number, chars:number, codePage:number) => {
         conProxyCall("putStr", jsid, this.wasmMem.getString(chars), codePage);
      }

      const conGetProp = (jsid:number, pn:number) => {
         const propName=this.wasmMem.getString(pn);
         return conProxyCall("getProp", jsid, propName);
      }

      const twrGetConIDFromNameImpl = (nameIdx:number):number => {
         const name=this.wasmMem.getString(nameIdx);
         const id=this.ioNamesToID[name];
         if (id)
            return id;
         else
            return -1;
      }

      const wasmMemFuncCall = (func: Function, ...params:any[]) => {
         return func.call(this.wasmMem, ...params);
      }

      const floatUtil=new twrFloatUtil();

      const imports:WebAssembly.ModuleImports = {
         ...this.libimports,
         twrTimeEpoch:twrTimeEpochImpl,
         twrTimeTmLocal:wasmMemFuncCall.bind(null, twrTimeTmLocalImpl),
         twrUserLconv:wasmMemFuncCall.bind(null, twrUserLconvImpl),
         twrUserLanguage:wasmMemFuncCall.bind(null, twrUserLanguageImpl),
         twrRegExpTest1252:wasmMemFuncCall.bind(null, twrRegExpTest1252Impl),
         twrToLower1252:wasmMemFuncCall.bind(null, twrToLower1252Impl),
         twrToUpper1252:wasmMemFuncCall.bind(null, twrToUpper1252Impl),
         twrStrcoll:wasmMemFuncCall.bind(null, twrStrcollImpl),
         twrUnicodeCodePointToCodePage:wasmMemFuncCall.bind(null, twrUnicodeCodePointToCodePageImpl),
         twrGetDtnames:wasmMemFuncCall.bind(null, twrGetDtnamesImpl),
         twrCodePageToUnicodeCodePoint:this.cpTranslate.convert.bind(this.cpTranslate),
         twrGetConIDFromName: twrGetConIDFromNameImpl,

         twrSleep:waitingCallsProxy.sleep.bind(waitingCallsProxy),

         twrConCharOut:conProxyCall.bind(null, "charOut"),
         twrConCharIn:conProxyCall.bind(null, "charIn"),
         twrSetFocus:conProxyCall.bind(null, "setFocus"),

         twrConGetProp:conGetProp,
         twrConCls:conProxyCall.bind(null, "cls"),
         twrConSetC32:conProxyCall.bind(null, "setC32"),
         twrConSetReset:conProxyCall.bind(null, "setReset"),
         twrConPoint:conProxyCall.bind(null, "point"),
         twrConSetCursor:conProxyCall.bind(null, "setCursor"),
         twrConSetColors:conProxyCall.bind(null, "setColors"),
         twrConSetRange:conSetRange,
         twrConPutStr:conPutStr,

         twrConDrawSeq:conProxyCall.bind(null, "drawSeq"),
         twrConLoadImage: conProxyCall.bind(null, "loadImage"),

         twrSin:Math.sin,
         twrCos:Math.cos,
         twrTan: Math.tan,
         twrFAbs: Math.abs,
         twrACos: Math.acos,
         twrASin: Math.asin,
         twrATan: Math.atan,
         twrExp: Math.exp,
         twrFloor: Math.floor,
         twrCeil: Math.ceil,
         twrFMod: function(x:number, y:number) {return x%y},
         twrLog: Math.log,
         twrPow: Math.pow,
         twrSqrt: Math.sqrt,
         twrTrunc: Math.trunc,

         twrDtoa: floatUtil.dtoa.bind(floatUtil),
         twrToFixed: floatUtil.toFixed.bind(floatUtil),
         twrToExponential: floatUtil.toExponential.bind(floatUtil),
         twrAtod: floatUtil.atod.bind(floatUtil),
         twrFcvtS: floatUtil.fcvtS.bind(floatUtil)
      }
   
      await super.loadWasm(pathToLoad, imports);

      floatUtil.mem=this.wasmMem;


      // SharedArrayBuffer required for twrWasmModuleAsync/twrWasmModuleAsyncProxy
      // instanceof SharedArrayBuffer doesn't work when crossOriginIsolated not enable, and will cause a runtime error
      // (don't check for instanceof SharedArrayBuffer, since it can cause an runtime error when SharedArrayBuffer does not exist)
      if (this.wasmMem.memory.buffer instanceof ArrayBuffer) 
         throw new Error("twrWasmModuleAsync requires shared Memory. Add wasm-ld --shared-memory --no-check-features (see docs)");
      else
         postMessage(["twrWasmModule", undefined, "setmemory", this.wasmMem.memory]);

      // init C runtime
      const init=this.exports.twr_wasm_init as Function;
      init(this.ioNamesToID.stdio, this.ioNamesToID.stderr, this.ioNamesToID.std2d==undefined?-1:this.ioNamesToID.std2d, this.wasmMem.mem8.length);
   }
}


