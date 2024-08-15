import {IWasmMemory, twrWasmMemory} from './twrmodmem.js'
import {twrWasmCall} from "./twrmodcall.js"


// twrWasmBase is the common code for any twrWasmModuleXXX that loads a .wasm file 
// into its thread.  This is twrWasmModule and twrWasmModuleAsyncProxy.
// twrWasmBase implements loadWasm (which is passed an import list), as well
// as containing the classes twrWasmMemory (to access wasm memory) and 
// twrWasmCall (to call wasm exports)

export class twrWasmBase {
   exports!:WebAssembly.Exports;
   wasmMem!: IWasmMemory;
   callCInstance!: twrWasmCall;
   callC!:twrWasmCall["callC"];

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
      this.wasmMem=new twrWasmMemory(memory, free, malloc);
      this.callCInstance=new twrWasmCall(this.wasmMem, this.exports);
      this.callC=this.callCInstance.callC.bind(this.callCInstance);
   }
}
