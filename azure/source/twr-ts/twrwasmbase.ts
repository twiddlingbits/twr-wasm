import {IWasmMemory, twrWasmMemory} from './twrwasmmem.js'
import {twrWasmCall} from "./twrwasmcall.js"
import { twrEventQueueReceive } from './twreventqueue.js';


// twrWasmBase is the common code for any twrWasmModuleXXX that loads a .wasm file into its thread.  
// This is twrWasmModule and twrWasmModuleAsyncProxy.
// twrWasmBase implements loadWasm (which is passed an import list), as well as containing the classes 
// twrWasmMemory (to access wasm memory) and twrWasmCall (to call wasm exports)

export type TOnEventCallback = (eventID:number, ...args:number[])=>void;

export class twrWasmBase {
   exports!:WebAssembly.Exports;
   wasmMem!: IWasmMemory;
   wasmCall!: twrWasmCall;
   callC!:twrWasmCall["callC"];

   /*********************************************************************/

   private getImports(imports:WebAssembly.ModuleImports) {
      return {
         ...imports, 
         twr_register_callback:this.registerCallback.bind(this)
      }
   }

   async loadWasm(pathToLoad:string, imports:WebAssembly.ModuleImports) {
      let response;
      try {
         response=await fetch(pathToLoad);
         if (!response.ok) throw new Error("Fetch response error on file '"+pathToLoad+"'\n"+response.statusText);
      } catch(err:any) {
         console.log('loadWasm() failed to fetch: '+pathToLoad);
         throw err;
      }

      let instance;
      try {
         const wasmBytes = await response.arrayBuffer();
         instance = await WebAssembly.instantiate(wasmBytes, {env: this.getImports(imports)});
      } catch(err:any) {
         console.log('Wasm instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
         throw err;
      }

      if (this.exports) throw new Error ("Unexpected error -- this.exports already set");
      if (!instance.instance.exports) throw new Error("Unexpected error - undefined instance.exports");
      this.exports=instance.instance.exports;

      const memory=this.exports.memory as WebAssembly.Memory;
      if (!memory) throw new Error("Unexpected error - undefined exports.memory");

      const malloc=this.exports.malloc as (size:number)=>number;
      const free=this.exports.free as (size:number)=>number;
      this.wasmMem=new twrWasmMemory(memory, free, malloc);
      this.wasmCall=new twrWasmCall(this.wasmMem, this.exports);
      this.callC=this.wasmCall.callC.bind(this.wasmCall);
   }

   
   //see twrWasmModule.constructor - imports - twr_register_callback:this.registerCallback.bind(this), 
   registerCallback(funcNameIdx:number) {
      const funcName=this.wasmMem.getString(funcNameIdx);
      const onEventCallback = this.exports[funcName] as TOnEventCallback;
      return twrEventQueueReceive.registerCallback(funcName, onEventCallback);
   }

}
