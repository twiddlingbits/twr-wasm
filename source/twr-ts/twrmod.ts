import {parseModOptions, IModOpts} from "./twrmodutil.js"
import {IConsole, logToCon} from "./twrcon.js"
import {twrLibraryInstanceRegistry} from "./twrlibrary.js";
import {IWasmMemory} from './twrwasmmem.js'
import {twrWasmCall} from "./twrwasmcall.js"
import {twrWasmBase, TOnEventCallback} from "./twrwasmbase.js"
import {twrEventQueueReceive} from "./twreventqueue.js"
import {twrLibBuiltIns} from "./twrlibbuiltin.js"

/*********************************************************************/

// Partial<IWasmMemory> defines the deprecated, backwards compatible 
// memory access APIs that are at the module level.  
// New code should use wasmMem.
export interface IWasmModule extends Partial<IWasmMemory> {
   loadWasm: (pathToLoad:string)=>Promise<void>;
   wasmMem: IWasmMemory;
   wasmCall: twrWasmCall;
   callC:twrWasmCall["callC"];
   isTwrWasmModuleAsync:false;   // to avoid circular references -- check if twrWasmModule without importing twrWasmModule
   //TODO!! move below into IWasmModuleBase ?
   postEvent: TOnEventCallback;
   fetchAndPutURL: (fnin:URL)=>Promise<[number, number]>;
   divLog:(...params: string[])=>void;
   log:(...params: string[])=>void;
}


/*********************************************************************/

export class twrWasmModule extends twrWasmBase implements IWasmModule {
   io:{[key:string]: IConsole};
   ioNamesToID: {[key: string]: number};
   isTwrWasmModuleAsync:false=false;

   // divLog is deprecated.  Use IConsole.putStr or log
   divLog:(...params: string[])=>void;
   log:(...params: string[])=>void;

   // IWasmMemory
   // These are deprecated, use wasmMem instead.
   memory!:WebAssembly.Memory;
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

   malloc!:(size:number)=>number;
   free!:(size:number)=>void;
   putString!:(sin:string, codePage?:number)=>number;
   putU8!:(u8a:Uint8Array)=>number;
   putArrayBuffer!:(ab:ArrayBuffer)=>number;

   /*********************************************************************/

   constructor(opts:IModOpts={}) {
      super();
      [this.io, this.ioNamesToID] = parseModOptions(opts);
      this.log=logToCon.bind(undefined, this.io.stdio);
      this.divLog=this.log;
   }

   /*********************************************************************/

   async loadWasm(pathToLoad:string) {

      // load builtin libraries
      await twrLibBuiltIns();

      const twrConGetIDFromNameImpl = (nameIdx:number):number => {
         const name=this.wasmMem!.getString(nameIdx);
         const id=this.ioNamesToID[name];
         if (id)
            return id;
         else
            return -1;
      }

      let imports:WebAssembly.ModuleImports={};
      for (let i=0; i<twrLibraryInstanceRegistry.libInterfaceInstances.length; i++) {
         const lib=twrLibraryInstanceRegistry.libInterfaceInstances[i];
         imports={...imports, ...lib.getImports(this)};
      }

      imports={
         ...imports,
         twrConGetIDFromName: twrConGetIDFromNameImpl,
      }

      await super.loadWasm(pathToLoad, imports);

      if (!(this.wasmMem.memory.buffer instanceof ArrayBuffer))
         console.log("twrWasmModule does not require shared Memory. Okay to remove wasm-ld --shared-memory --no-check-features");

      // backwards compatible
      this.memory = this.wasmMem.memory;
      this.mem8 = this.wasmMem.mem8;
      this.mem32 = this.wasmMem.mem32;
      this.memD = this.wasmMem.memD;
      this.malloc = this.wasmMem.malloc;
      this.free = this.wasmMem.free;
      this.stringToU8=this.wasmMem.stringToU8;
      this.copyString=this.wasmMem.copyString;
      this.getLong=this.wasmMem.getLong;
      this.setLong=this.wasmMem.setLong;
      this.getDouble=this.wasmMem.getDouble;
      this.setDouble=this.wasmMem.setDouble;
      this.getShort=this.wasmMem.getShort;
      this.getString=this.wasmMem.getString;
      this.getU8Arr=this.wasmMem.getU8Arr;
      this.getU32Arr=this.wasmMem.getU32Arr;
   
      this.putString=this.wasmMem.putString;
      this.putU8=this.wasmMem.putU8;
      this.putArrayBuffer=this.wasmMem.putArrayBuffer;

      // init C runtime
      const init=this.exports.twr_wasm_init as Function;
      init(this.ioNamesToID.stdio, this.ioNamesToID.stderr, this.ioNamesToID.std2d==undefined?-1:this.ioNamesToID.std2d, this.wasmMem.mem8.length);
   }
   
   /*********************************************************************/

   // given a url, load its contents, and stuff into Wasm memory similar to Unint8Array
   // TODO!! Doc that this is no longer a CallC option, and must be called here manually
   async fetchAndPutURL(fnin:URL):Promise<[number, number]> {

      if (!(typeof fnin === 'object' && fnin instanceof URL))
         throw new Error("fetchAndPutURL param must be URL");

      try {
         let response=await fetch(fnin);
         let buffer = await response.arrayBuffer();
         let src = new Uint8Array(buffer);
         let dest=this.wasmMem.putU8(src);
         return [dest, src.length];
         
      } catch(err:any) {
         console.log('fetchAndPutURL Error. URL: '+fnin+'\n' + err + (err.stack ? "\n" + err.stack : ''));
         throw err;
      }
   }

   postEvent(eventID:number, ...params:number[]) {
      //TODO!! PostEvent into eventQueueSend, then processEvents -- to enable non callback events when i add them
      const onEventCallback=twrEventQueueReceive.onEventCallbacks[eventID];
      if (!onEventCallback) 
         throw new Error("twrWasmModule.postEvent called with invalid eventID: "+eventID+", params: "+params);
      
      onEventCallback(eventID, ...params);
   }

   peekEvent(eventName:string) {
      // get earliest inserted entry in event Map
      //const ev=this.events.get(eventName)
   }
  // called (RPC) by twrLibraryProxy
  // waitEvent(eventName:string) {
  //    const evIdx=peekTwrEvent(eventName);
  //    if (evIdx) {
  //       this.returnValue!.write(evIdx);
  //    }
  //    else {
  //       this.addEventListner(eventName, (evIdx:number)=> {
  //          this.returnValue!.write(evIdx);
  //       });
  //    }
}




