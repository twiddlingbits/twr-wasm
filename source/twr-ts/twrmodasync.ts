import {IAllProxyParams} from "./twrmodasyncproxy.js"
import {IConsole, logToCon} from "./twrcon.js";
import {parseModOptions, IModOpts} from './twrmodutil.js'
import {IWasmMemoryAsync, twrWasmMemoryAsync} from "./twrwasmmem.js";
import {twrWasmModuleCallAsync, TCallCAsync, TCallCImplAsync } from "./twrwasmcall.js"
import {TLibraryMessage, TLibraryProxyParams, twrLibraryInstanceRegistry} from "./twrlibrary.js"
import {twrEventQueueSend} from "./twreventqueue.js"
import {twrLibBuiltIns} from "./twrlibbuiltin.js"

// class twrWasmModuleAsync consist of two parts:
//   twrWasmModuleAsync runs in the main JavaScript event loop
//   twrWasmModuleAsyncProxy runs in a WebWorker thread
//      - the wasm module is loaded by the webworker, and C calls into javascript are handed by proxy classes which call the 'main' class via a message

// IWasmModuleAsync is the Async version of IWasmModule
// Partial<IWasmMemoryAsync> defines the deprecated module level memory access functions


export type TModuleMessage=[msgClass:"twrWasmModule", id:number, msgType:string, ...params:any[]];

export type TModAsyncMessage=TLibraryMessage|TModuleMessage;

export interface IWasmModuleAsync extends Partial<IWasmMemoryAsync> {
   loadWasm: (pathToLoad:string)=>Promise<void>;
   wasmMem: IWasmMemoryAsync;
   callCInstance: twrWasmModuleCallAsync;
   callC:TCallCAsync;
   callCImpl:TCallCImplAsync;
   eventQueueSend:twrEventQueueSend;
   isTwrWasmModuleAsync:true;  // to avoid circular references -- check if twrWasmModuleAsync without importing twrWasmModuleAsync
   //TODO!! put these into twrWasmModuleBase?
   postEvent:(eventID:number, ...params:number[])=>void;
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
   io:{[key:string]: IConsole};
   ioNamesToID: {[key: string]: number};
   wasmMem!: IWasmMemoryAsync;
   callCInstance!: twrWasmModuleCallAsync;
   eventQueueSend:twrEventQueueSend=new twrEventQueueSend;
   isTwrWasmModuleAsync:true=true;


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

      this.divLog=logToCon.bind(undefined, this.io.stdio);
   }

   async loadWasm(pathToLoad:string) {
      if (this.initLW) 	throw new Error("twrWasmModuleAsync::loadWasm can only be called once per instance");
      this.initLW=true;

      // load builtin libraries
      await twrLibBuiltIns();

      return new Promise<void>((resolve, reject)=>{
         this.loadWasmResolve=resolve;
         this.loadWasmReject=reject;

         // libProxyParams will be everything needed to create Proxy versions of all twrLibraries
         // libClassInstances has one entry per class, even if multiple instances of same class are registered (ie, interfaceName set)
         let libProxyParams:TLibraryProxyParams[] = [];
         for (let i=0; i<twrLibraryInstanceRegistry.libInterfaceInstances.length; i++) {
            libProxyParams.push(twrLibraryInstanceRegistry.libInterfaceInstances[i].getProxyParams());
         }

         const allProxyParams:IAllProxyParams={
            libProxyParams: libProxyParams,
            ioNamesToID: this.ioNamesToID,  // console instance name mappings
            eventQueueBuffer: this.eventQueueSend.circBuffer.saBuffer
         };
         const urlToLoad = new URL(pathToLoad, document.URL);
         const startMsg:TModAsyncProxyStartupMsg={ urlToLoad: urlToLoad.href, allProxyParams: allProxyParams};
         this.myWorker.postMessage(['startup', startMsg]);
      });
   }

   postEvent(eventID:number, ...params:number[]) {
      this.eventQueueSend.postEvent(eventID, ...params);
      this.myWorker.postMessage(['tickleEventLoop']);
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

   // this implementation piggybacks of callCImpl -- it is essentially a specific version of callC
   // instead of sending a message to the twrWasmModuleAsync thread (as callCImpl does), we post a malloc command
   // in the eventQueue.  This allows it to be processed  by the twrWasmModuleAsync event loop.  malloc was previously sent using callCImpl, but 
   // callCImpl uses postMessage, and the twrWasmModuleAsync thread will not process the callCImpl message while inside another callC,
   // and malloc may be used by wasmMem.putXX functions, inside twrWasmLibrary derived classes, which are called from C, inside of a callC.
   //
   async mallocImpl(size:number) {
      return new Promise<any>((resolve, reject)=>{
         const p:ICallCPromise={
            callCResolve: resolve,
            callCReject: reject
         }
        this.callCMap.set(++this.uniqueInt, p);
         this.eventQueueSend.postMalloc(this.uniqueInt, size);
         this.myWorker.postMessage(['tickleEventLoop']);
      });
   }
   
   // the API user can call this to default to stdio
   // or the API user can call keyDown on a particular console
   keyDown(ev:KeyboardEvent) {
      if (!this.io.stdio) throw new Error("internal error - stdio not defined");
      if (!this.io.stdio.keyDown) throw new Error("stdio.keyDown not defined. Console must implemented IConsoleStreamIn.")
      this.io.stdio.keyDown(ev);
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

   //  this.myWorker.onmessage = this.processMsg.bind(this);
   async processMsg(event: MessageEvent<TModAsyncMessage>) {
      const msg=event.data;
      const [msgClass, id]=msg;

      //console.log("twrWasmAsyncModule - got message: "+event.data)

      if (msgClass==="twrWasmModule") {
         const [,, msgType, ...params]=msg;
         
         switch (msgType) {
            case "setmemory":
               this.memory=params[0];
               if (!this.memory) throw new Error("unexpected error - undefined memory");

               this.wasmMem=new twrWasmMemoryAsync(this.memory, this.mallocImpl.bind(this), this.callCImpl.bind(this));
               this.callCInstance=new twrWasmModuleCallAsync(this.wasmMem, this.callCImpl.bind(this));

               // backwards compatible
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
      
      else if (msgClass==="twrLibrary") {
         const lib=twrLibraryInstanceRegistry.getLibraryInstance(id);
         const msgLib=msg as TLibraryMessage;
         await lib.processMessageFromProxy(msg, this);
      }

      else {
         throw new Error("twrWasmAsyncModule - unknown and unexpected msgClass: "+msgClass);
      }
   }

   // given a url, load its contents, and stuff into Wasm memory similar to Unint8Array
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
