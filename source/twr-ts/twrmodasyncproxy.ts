import {TModAsyncProxyStartupMsg} from "./twrmodasync.js"
import {twrWasmBase} from "./twrwasmbase.js"
import {TLibraryProxyParams, twrLibraryProxy, twrLibraryInstanceProxyRegistry} from "./twrlibrary.js"
import {twrEventQueueReceive} from "./twreventqueue.js"
export interface IAllProxyParams {
   libProxyParams: TLibraryProxyParams[], 
   ioNamesToID: {[key:string]: number},  // name to id mappings for this module
   eventQueueBuffer: SharedArrayBuffer
}

let mod:twrWasmModuleAsyncProxy;

self.onmessage = function(e:MessageEvent<[string, ...params:any]>) {
    //console.log('twrworker.js: message received from main script: '+e.data);

    const [msgType, ...params]=e.data;

    if (msgType==='startup') {
        const [startMsg]=params as [TModAsyncProxyStartupMsg];
        //console.log("Worker startup params:",params);
        mod=new twrWasmModuleAsyncProxy(startMsg.allProxyParams);

        mod.loadWasm(startMsg.urlToLoad).then( ()=> {
            postMessage(["twrWasmModule", undefined, "startupOkay"]);
        }).catch( (ex)=> {
            console.log(".catch: ", ex);
            postMessage(["twrWasmModule", undefined, "startupFail", ex]);
        });
    }
    else if (msgType==='callC') {
         const [callcID, funcName, cparams]=params as [id:number, funcName:string, cparams?: (number | bigint)[]];
         try {
            const rc=mod.callCInstance.callCImpl(funcName, cparams);
            postMessage(["twrWasmModule", callcID, "callCOkay", rc]);
         }
         catch(ex: any) {
            console.log("exception in callC in 'twrmodasyncproxy.js': \n", params);
            console.log(ex);
            postMessage(["twrWasmModule", callcID, "callCFail", ex]);
        }
    }
    else if (msgType==='tickleEventLoop') {
         mod.eventQueueReceive.processIncomingCommands();
    }
    else {
        console.log("twrmodasyncproxy.js: unknown message: "+e);
    }
}

// ************************************************************************

export class twrWasmModuleAsyncProxy extends twrWasmBase {
   allProxyParams:IAllProxyParams;
   ioNamesToID: {[key: string]: number};
   libimports:WebAssembly.ModuleImports ={};
   eventQueueReceive: twrEventQueueReceive;

   constructor(allProxyParams:IAllProxyParams) {
      super();
      this.allProxyParams=allProxyParams;
      this.ioNamesToID=allProxyParams.ioNamesToID;
      this.eventQueueReceive=new twrEventQueueReceive(this, allProxyParams.eventQueueBuffer);

   }
         
   async loadWasm(pathToLoad: string): Promise<void> {

      // create twrLibraryProxy versions for each twrLibrary
      for (let i=0; i<this.allProxyParams.libProxyParams.length; i++) {
         const params=this.allProxyParams.libProxyParams[i];
         const lib = new twrLibraryProxy(params);
         // TODO!! This registry isn't actually being used (yet)?
         twrLibraryInstanceProxyRegistry.registerProxy(lib)
         this.libimports={...this.libimports, ...await lib.getProxyImports(this)};
      }        
      
       const twrConGetIDFromNameImpl = (nameIdx:number):number => {
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

      const imports:WebAssembly.ModuleImports = {
         ...this.libimports,
         twrConGetIDFromName: twrConGetIDFromNameImpl,
      }
   
      await super.loadWasm(pathToLoad, imports);

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


