import {IWasmMemory, twrWasmModuleMemory} from './twrmodmem.js'
import {twrWasmModuleCall} from "./twrmodcall.js"


// twrWasmModuleBase is the common code for any twrWasmModuleXXX that loads a .wasm file 
// into its thread.  This is twrWasmModule and twrWasmModuleAsyncProxy.
// twrWasmModuleBase implements loadWasm (which is passed an import list), as well
// as containing the classes twrWasmModuleMemory (to access wasm memory) and 
// twrWasmModuleCall (to call wasm exports)

export class twrWasmModuleBase {
   exports!:WebAssembly.Exports;
   wasmMem!: IWasmMemory;
   callCInstance!: twrWasmModuleCall;
   callC!:twrWasmModuleCall["callC"];

   /*********************************************************************/

   constructor() {
   }

   /*********************************************************************/

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
         instance = await WebAssembly.instantiate(wasmBytes, {env: imports});
      } catch(err:any) {
         console.log('Wasm instantiate error: ' + err + (err.stack ? "\n" + err.stack : ''));
         throw err;
      }

      if (this.exports) throw new Error ("Unexpected error -- this.exports already set");
      this.exports=instance.instance.exports;
      if (!this.exports) throw new Error("Unexpected error - undefined instance.exports");

      const memory=this.exports.memory as WebAssembly.Memory;
      if (!memory) throw new Error("Unexpected error - undefined exports.memory");

      const malloc=this.exports.malloc as (size:number)=>number;
      const free=this.exports.free as (size:number)=>number;
      this.wasmMem=new twrWasmModuleMemory(memory, free, malloc);
      this.callCInstance=new twrWasmModuleCall(this.wasmMem, this.exports);
      this.callC=this.callCInstance.callC.bind(this.callCInstance);
   }
}
