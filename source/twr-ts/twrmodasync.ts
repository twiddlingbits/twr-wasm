import {IAllProxyParams, TModAsyncMessage} from "./twrmodasyncproxy.js"
import {twrWaitingCalls} from "./twrwaitingcalls.js"
import {IConsole, keyDownUtil, TConsoleProxyParams, logToCon} from "./twrcon.js";
import {twrConsoleRegistry} from "./twrconreg.js"
import {parseModOptions, IModOpts} from './twrmodutil.js'
import { IWasmMemoryAsync, twrWasmModuleMemoryAsync } from "./twrmodmem.js";
import {twrWasmModuleCallAsync, TCallCAsync, TCallCImplAsync } from "./twrmodcall.js"
import {TLibraryProxyParams, twrLibraryInstanceRegistry} from "./twrlibrary.js"

// class twrWasmModuleAsync consist of two parts:
//   twrWasmModuleAsync runs in the main JavaScript event loop
//   twrWasmModuleAsyncProxy runs in a WebWorker thread
//      - the wasm module is loaded by the webworker, and C calls into javascript are handed by proxy classes which call the 'main' class via a message




/*
   async callC(params:[string, ...(string|number|bigint|ArrayBuffer|URL)[]]) {
*/


export interface IWasmModuleAsync extends Partial<IWasmMemoryAsync> {
   loadWasm: (pathToLoad:string)=>Promise<void>;
   wasmMem: IWasmMemoryAsync;
   callCInstance: twrWasmModuleCallAsync;
   callC:TCallCAsync;
   callCImpl:TCallCImplAsync;
   fetchAndPutURL: (fnin:URL)=>Promise<[number, number]>;
   divLog:(...params: string[])=>void;
}

export type TModAsyncProxyStartupMsg = {
   urlToLoad: string,
   allProxyParams: IAllProxyParams,
};

interface ICallCPromise {
   callCResolve: (value: any) => void;
   callCReject: (reason?: any) => void;
}
      
export class twrWasmModuleAsync implements IWasmModuleAsync {
   myWorker:Worker;
   loadWasmResolve?: (value: void) => void;
   loadWasmReject?: (reason?: any) => void;
   callCMap:Map<number, ICallCPromise>;
   uniqueInt: number;
   initLW=false;
   waitingcalls:twrWaitingCalls;
   io:{[key:string]: IConsole};
   ioNamesToID: {[key: string]: number};
   wasmMem!: IWasmMemoryAsync;
   callCInstance!: twrWasmModuleCallAsync;

   // divLog is deprecated.  Use IConsole.putStr
   divLog:(...params: string[])=>void;

   // IWasmMemory
   // These are deprecated, use wasmMem instead.
   memory!:WebAssembly.Memory;
   exports!:WebAssembly.Exports;
   mem8!:Uint8Array;
   mem32!:Uint32Array;
   memD!:Float64Array;
   stringToU8!:(sin:string, codePage?:number)=>Uint8Array;
   copyString!:(buffer:number, buffer_size:number, sin:string, codePage?:number)=>void;
   getLong!:(idx:number)=>number;
   setLong!:(idx:number, value:number)=>void;
   getDouble!:(idx:number)=>number;
   setDouble!:(idx:number, value:number)=>void;
   getShort!:(idx:number)=>number;
   getString!:(strIndex:number, len?:number, codePage?:number)=>string;
   getU8Arr!:(idx:number)=>Uint8Array;
   getU32Arr!:(idx:number)=>Uint32Array;

   malloc!:(size:number)=>Promise<number>;
   free!:(size:number)=>Promise<void>;
   putString!:(sin:string, codePage?:number)=>Promise<number>;
   putU8!:(u8a:Uint8Array)=>Promise<number>;
   putArrayBuffer!:(ab:ArrayBuffer)=>Promise<number>;

   constructor(opts?:IModOpts) {

      [this.io, this.ioNamesToID] = parseModOptions(opts);

      this.callCMap=new Map();
      this.uniqueInt=1;

      if (!window.Worker) throw new Error("This browser doesn't support web workers.");
      const url=new URL('twrmodasyncproxy.js', import.meta.url);
      this.myWorker = new Worker(url, {type: "module" });
      this.myWorker.onerror = (event: ErrorEvent) => {
         console.log("this.myWorker.onerror (undefined message typically means Worker failed to load)");
         console.log("event.message: "+event.message)
         throw event;
      };
      this.myWorker.onmessage= this.processMsg.bind(this);

      this.waitingcalls=new twrWaitingCalls();  // handle's calls that cross the worker thread - main js thread boundary
      this.divLog=logToCon.bind(undefined, this.io.stdio);
   }

   async loadWasm(pathToLoad:string) {
      if (this.initLW) 	throw new Error("twrWasmModuleAsync::loadWasm can only be called once per instance");
      this.initLW=true;

      return new Promise<void>((resolve, reject)=>{
         this.loadWasmResolve=resolve;
         this.loadWasmReject=reject;

         // conProxyParams will be everything needed to create Proxy versions of all IConsoles, 
         // and create the proxy registry
         let conProxyParams:TConsoleProxyParams[] = [];
         for (let i=0; i<twrConsoleRegistry.consoles.length; i++) {
            conProxyParams.push(twrConsoleRegistry.consoles[i].getProxyParams());
         }

         // libProxyParams will be everything needed to create Proxy versions of all twrLibraries, 
         // TODO!!! ? This implementation assume each library has exactly one instance
         // TODO!!! ? current implementation has no libs: (akin to io).  
         let libProxyParams:TLibraryProxyParams[] = [];
         for (let i=0; i<twrLibraryInstanceRegistry.libInstances.length; i++) {
            libProxyParams.push(twrLibraryInstanceRegistry.libInstances[i].getProxyParams());
         }

         const allProxyParams:IAllProxyParams={
            conProxyParams: conProxyParams,
            libProxyParams: libProxyParams,
            ioNamesToID: this.ioNamesToID,  // console instance name mappings
            waitingCallsProxyParams: this.waitingcalls.getProxyParams(),
         };
         const urlToLoad = new URL(pathToLoad, document.URL);
         const startMsg:TModAsyncProxyStartupMsg={ urlToLoad: urlToLoad.href, allProxyParams: allProxyParams};
         this.myWorker.postMessage(['startup', startMsg]);
      });
   }

   async callC(params:[string, ...(string|number|bigint|ArrayBuffer)[]]) {
      const cparams=await this.callCInstance.preCallC(params); // will also validate params[0]
      const retval=await this.callCImpl(params[0], cparams);
      await this.callCInstance.postCallC(cparams, params);
      return retval;
   }	

   async callCImpl(fname:string, cparams:(number|bigint)[]=[]) {
      return new Promise<any>((resolve, reject)=>{
         const p:ICallCPromise={
            callCResolve: resolve,
            callCReject: reject
         }
         this.callCMap.set(++this.uniqueInt, p);
         this.myWorker.postMessage(['callC', this.uniqueInt, fname, cparams]);
      });
   }
   
   // the API user can call this to default to stdio
   // or the API user can call keyDown on a particular 
   keyDown(ev:KeyboardEvent) {
      keyDownUtil(this.io.stdio, ev);
   }

   // this function is deprecated and here for backward compatibility
   keyDownDiv(ev:KeyboardEvent) {
      if (this.io.stdio.element && this.io.stdio.element.id=="twr_iodiv")
         this.keyDown(ev);
      else  
         throw new Error("keyDownDiv is deprecated, but in any case should only be used with twr_iodiv")
   }

   // this function is deprecated and here for backward compatibility
   keyDownCanvas(ev:KeyboardEvent) {
      if (this.io.stdio.element && this.io.stdio.element.id=="twr_iocanvas")
         this.keyDown(ev);
      else  
         throw new Error("keyDownCanvas is deprecated, but in any case should only be used with twr_iocanvas")
   }

   processMsg(event: MessageEvent<TModAsyncMessage>) {
      const msg=event.data;
      const [msgClass, id, msgType, ...params]=msg;

      //console.log("twrWasmAsyncModule - got message: "+event.data)

      if (msgClass=="twrWasmModule") {
         switch (msgType) {
            case "setmemory":
               this.memory=params[0];
               if (!this.memory) throw new Error("unexpected error - undefined memory");

               this.wasmMem=new twrWasmModuleMemoryAsync(this.memory, this.callCImpl.bind(this));
               this.callCInstance=new twrWasmModuleCallAsync(this.wasmMem, this.callCImpl.bind(this));

               // backwards compatible
               // TODO!! doc as deprecated, use this.wasmMem
               this.mem8 = this.wasmMem!.mem8;
               this.mem32 = this.wasmMem!.mem32;
               this.memD = this.wasmMem!.memD;
               this.stringToU8=this.wasmMem!.stringToU8;
               this.copyString=this.wasmMem!.copyString;
               this.getLong=this.wasmMem!.getLong;
               this.setLong=this.wasmMem!.setLong;
               this.getDouble=this.wasmMem!.getDouble;
               this.setDouble=this.wasmMem!.setDouble;
               this.getShort=this.wasmMem!.getShort;
               this.getString=this.wasmMem!.getString;
               this.getU8Arr=this.wasmMem!.getU8Arr;
               this.getU32Arr=this.wasmMem!.getU32Arr;
            
               this.malloc=this.wasmMem!.malloc;
               this.free=this.wasmMem!.free;
               this.putString=this.wasmMem!.putString;
               this.putU8=this.wasmMem!.putU8;
               this.putArrayBuffer=this.wasmMem!.putArrayBuffer;
               break;

            case "startupFail":
               const [returnCode]=params;
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
               const [returnCode]=params;
               const p=this.callCMap.get(id);
               if (!p) throw new Error("internal error");
               this.callCMap.delete(id);
               if (p.callCReject)
                  p.callCReject(returnCode);
               else
                  throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCReject)");
            }
               break;

            case "callCOkay":
            {
               const [returnCode]=params;
               const p=this.callCMap.get(id);
               if (!p) throw new Error("internal error");
               this.callCMap.delete(id);
               if (p.callCResolve)
                  p.callCResolve(returnCode);
               else
                  throw new Error("twrWasmAsyncModule.processMsg unexpected error (undefined callCResolve)");
               break;
            }

            default:
               throw new Error("internal error: "+msgType)
         }
      }
      

      else if (msgClass=="twrConsole") {
         const con=twrConsoleRegistry.getConsole(id);
         con.processMessage(msg, this.wasmMem);
      }

      else if (msgClass=="twrLibrary") {
         const lib=twrLibraryInstanceRegistry.getLibraryInstance(id);
         lib.processMessage(msg, this.wasmMem);
      }

      else if (msgClass=="twrWaitingCalls") {
         if (!this.waitingcalls) throw new Error ("internal error: this.waitingcalls undefined.")
         if (!this.waitingcalls.processMessage(msgType, params)) throw new Error("internal error watingcalls msg");
      }

      else {
         throw new Error("twrWasmAsyncModule - unknown and unexpected msgClass: "+msgClass);
      }
   }

   // given a url, load its contents, and stuff into Wasm memory similar to Unint8Array
   // TODO!! Doc that this is no longer a CallC option, and must be called here manually
   async fetchAndPutURL(fnin:URL):Promise<[number, number]> {

      if (!(typeof fnin === 'object' && fnin instanceof URL))
         throw new Error("fetchAndPutURL param must be URL");

      try {
         let response=await fetch(fnin);
         let buffer = await response.arrayBuffer();
         let src = new Uint8Array(buffer);
         let dest=await this.wasmMem.putU8(src);
         return [dest, src.length];
         
      } catch(err:any) {
         console.log('fetchAndPutURL Error. URL: '+fnin+'\n' + err + (err.stack ? "\n" + err.stack : ''));
         throw err;
      }
   }
}
