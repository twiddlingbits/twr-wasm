/* 
	* callC takes an array where:
	* the first entry is the name of the C function in the Wasm module to call (must be exported, typically via the --export clang flag)
	* and the next entries are a variable number of arguments to pass to the C function, of type
	* number - converted to int32 or float64 as appropriate
   * bigint - converted to int64
	* string - converted to a an index (ptr) into a module Memory returned via stringToMem()
	* ArrayBuffer - the array is loaded into module memory via putArrayBuffer
    */

import {twrWasmMemory, twrWasmMemoryAsync} from "./twrwasmmem";


export class twrWasmCall {
   exports: WebAssembly.Exports;
   mem: twrWasmMemory;

   constructor(mem:twrWasmMemory, exports:WebAssembly.Exports) {
      if (!exports) throw new Error("WebAssembly.Exports undefined");

      this.exports=exports;
      this.mem=mem;
   }

   callCImpl(fname:string, cparams:(number|bigint)[]=[]) {
      if (!this.exports[fname]) throw new Error("callC: function '"+fname+"' not in export table.  Use --export wasm-ld flag.");
      const f = this.exports[fname] as Function;
      let cr=f(...cparams);

      return cr;
   }

   callC(params:[string, ...(string|number|bigint|ArrayBuffer)[]]) {
      const cparams=this.preCallC(params);
      let retval = this.callCImpl(params[0], cparams);
      this.postCallC(cparams, params);
      return retval;
   }
   
   // convert an array of arguments to numbers by stuffing contents into malloc'd Wasm memory
   preCallC(params:[string, ...(string|number|bigint|ArrayBuffer)[]]) {
   
      if (!(params.constructor === Array)) throw new Error ("callC: params must be array, first arg is function name");
      if (params.length==0) throw new Error("callC: missing function name");
   
      let cparams:(number|bigint)[]=[];
      let ci=0;
      for (let i=1; i < params.length; i++) {
         const p=params[i];
         switch (typeof p) {
            case 'number':
            case 'bigint':
               cparams[ci++]=p;
               break;
            case 'string':
               cparams[ci++]=this.mem.putString(p);
               break;
            case 'object':
               if (p instanceof URL) {
                  throw new Error("URL arg in callC is no longer supported directly.  use module.fetchAndPutURL");
               }
               else if (p instanceof ArrayBuffer) {
                  const r=this.mem.putArrayBuffer(p);
                  cparams[ci++]=r;  // mem index
                  break;
               }
            default:
               throw new Error ("callC: invalid object type passed in");
         }
      }
   
      return cparams;
   }

   // free the mallocs; copy array buffer data from malloc back to arraybuffer
   postCallC(cparams:(number|bigint)[], params:[string, ...(string|number|bigint|ArrayBuffer)[]]) {

      let ci=0;
      for (let i=1; i < params.length; i++) {
         const p=params[i];
         switch (typeof p) {
            case 'number':
            case 'bigint':
               ci++;
               break;

            case 'string':
               this.callCImpl('free',[cparams[ci]])
               ci++;
               break;
               
            case 'object':
               if (p instanceof URL) {
                  //this.callCImpl('free',[cparams[ci]])
                  //ci=ci+2;
                  throw new Error("internal error");
               }
               else if (p instanceof ArrayBuffer) {
                  const u8=new Uint8Array(p);
                  const idx=cparams[ci] as number;
                  for (let j=0; j<u8.length; j++) 
                     u8[j]=this.mem.mem8[idx+j];  
                  this.callCImpl('free',[idx])
                  ci++;
                  break;
               }
               else 
                  throw new Error ("postCallC: internal error A");

            default:
               throw new Error ("postCallC: internal error B");
         }
      }

      return cparams;
   }
}

/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

  
export type TCallCImplAsync=(fname:string, cparams:(number|bigint)[])=>Promise<any>;
export type TCallCAsync=(params:[string, ...(string|number|bigint|ArrayBuffer)[]])=>Promise<any>;

export class twrWasmModuleCallAsync {
   mem: twrWasmMemoryAsync;
   callCImpl: TCallCImplAsync;

   constructor(mem:twrWasmMemoryAsync, callCImpl:TCallCImplAsync) {
      this.mem=mem;
      this.callCImpl=callCImpl;
   }

   // convert an array of arguments to numbers by stuffing contents into malloc'd Wasm memory
   async preCallC(params:[string, ...(string|number|bigint|ArrayBuffer)[]]) {

      if (!(params.constructor === Array)) throw new Error ("callC: params must be array, first arg is function name");
      if (params.length==0) throw new Error("callC: missing function name");

      let cparams:(number|bigint)[]=[];
      let ci=0;
      for (let i=1; i < params.length; i++) {
         const p=params[i];
         switch (typeof p) {
            case 'number':
            case 'bigint':
               cparams[ci++]=p;
               break;
            case 'string':
               cparams[ci++]=await this.mem.putString(p);
               break;
            case 'object':
               if (p instanceof URL) {
                  throw new Error("URL arg in callC is no longer supported directly.  use module.fetchAndPutURL");
               }
               else if (p instanceof ArrayBuffer) {
                  const r=await this.mem.putArrayBuffer(p);
                  cparams[ci++]=r;  // mem index
                  break;
               }
            default:
               throw new Error ("callC: invalid object type passed in");
         }
      }

      return cparams;
   }

   // free the mallocs; copy array buffer data from malloc back to arraybuffer
   async postCallC(cparams:(number|bigint)[], params:[string, ...(string|number|bigint|ArrayBuffer)[]]) {

      let ci=0;
      for (let i=1; i < params.length; i++) {
         const p=params[i];
         switch (typeof p) {
            case 'number':
            case 'bigint':
               ci++;
               break;

            case 'string':
               await this.callCImpl('free',[cparams[ci]])
               ci++;
               break;
               
            case 'object':
               if (p instanceof URL) {
                  //await this.callCImpl('free',[cparams[ci]])
                  //ci=ci+2;
                  throw new Error("internal error");
               }
               else if (p instanceof ArrayBuffer) {
                  const u8=new Uint8Array(p);
                  const idx=cparams[ci] as number;
                  for (let j=0; j<u8.length; j++) 
                     u8[j]=this.mem.mem8[idx+j];   // mod.mem8 is a Uint8Array view of the module's WebAssembly Memory
                  await this.callCImpl('free',[idx])
                  ci++;
                  break;
               }
               else 
                  throw new Error ("postCallC: internal error A");

            default:
               throw new Error ("postCallC: internal error B");
         }
      }

      return cparams;
   }

}
