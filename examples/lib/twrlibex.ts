import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports} from "twr-wasm"

export class twrLibraryExample extends twrLibrary {

   imports:TLibImports = {
      ex_listen_key_events:{},
      ex_single_shot_timer:{},
      ex_get_epoch:{},
      ex_append_two_strings:{isAsyncOverride: true}
   };

   // Because this function is in the imports list above, it will be added to the imports list for
   // both twrWasmModule and twrWasmModuleAsyncProxy
   // The callingMod argument is added by twrLibrary, it is not passed by the caller C function
   // If twrWasmModuleAsyncProxy will perform a remote procedure call into twrWasmModuleAsync, which calls this function
   // an eventID is retrieved by the C function calling twr_register_callback, which is implemented by twrWasmLibrary
   ex_listen_key_events(callingMod:IWasmModule|IWasmModuleAsync, eventID:number) {

      const keyEventListner = (event:KeyboardEvent) => {
         const r=keyEventToCodePoint(event);  // twr-wasm utility function
         if (r) {
            //postEvent can only post numbers -- no translation of arguments is performed prior to making the C event callback
            //currently only int32 is supported (which can be a pointer)
            callingMod.postEvent(eventID, r);
            //document.removeEventListener('keydown', keyEventListner);
         }
       }

      document.addEventListener('keydown', keyEventListner);
   }

   ex_single_shot_timer(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   ex_get_epoch(callingMod:IWasmModule|IWasmModuleAsync, eventID: number) {
      const date = Date.now();

      return date;
   }

   // Two versions of ex_append_two_strings are implemented -- an "extra" one that is "async".
   // Because this function is added to importsAsyncOverride, when called by twrWasmModuleAsyncProxy, 
   // ex_append_two_strings_async will be called with await (instead of ex_append_two_strings called with no await)
   // Note that when adding the function name to importsAsyncOverride, you use the same function name as the non async version. 
   // The "_async" will be added automatically to the function name to generate the async version of the function to call.
   // callingMod.wasmMem can be used to access module memory.   WasmMemoryAsync will be used if the calling module is twrWasmModuleAsync,
   // while WasmMemory will be used if the calling module is a twrWasmModule.
   // "WasmMemoryAsync.putXX", are async functions, while "WasmMemory.putXX" are not.
   ex_append_two_strings(callingMod:IWasmModule|IWasmModuleAsync, str1Idx:number, str2Idx:number) {
      const newStr=callingMod.wasmMem.getString(str1Idx)+callingMod.wasmMem.getString(str2Idx);
      const rv=callingMod.wasmMem.putString(newStr);
      return rv;
   }
   
   async ex_append_two_strings_async(callingMod:IWasmModule|IWasmModuleAsync, str1Idx:number, str2Idx:number) {
      const newStr=callingMod.wasmMem.getString(str1Idx)+callingMod.wasmMem.getString(str2Idx);
      const rv=await callingMod.wasmMem.putString(newStr);
      return rv;
   }

   //TODO!! Add to the test app -- calling the same library from two modules -- one async, one not.
   //TODO!! add twr_register_event
   //TODO!! I tired adding isAsyncProxyOverride, but it presents the difficulty function to call (which is derived from twrLibrary), is not accessible to twrLibraryProxy.  Consider dynamic import?
}


