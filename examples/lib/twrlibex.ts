import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint} from "twr-wasm"

export class twrLibraryExample extends twrLibrary {
   imports = ["ex_listen_key_events", "ex_single_shot_timer", "ex_get_epoch", "ex_append_two_strings"];

   constructor () {
      super();
   }

   // Because this function is in the imports list above, it will be added to the imports list for
   // both twrWasmModule and twrWasmModuleAsyncProxy
   // The callingMod argument is added by twrLibrary, it is not passed by the caller C function
   // If twrWasmModuleAsyncProxy is being used it essentaily performs a remote procedure call into twrWasmModuleAsync
   // an eventID is retrieved by the C function calling twr_register_callback, which is implemented by twrWasmLibrary
   ex_listen_key_events(callingMod:IWasmModule|IWasmModuleAsync, eventID:number) {

      const keyEventListner = (event:KeyboardEvent) => {
         const r=keyEventToCodePoint(event);  // twr-wasm utility function
         if (r) {
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

   //TODO!! This case is incomplete.  No message posted so blocking version doesn't wait for a response. TODO!! Will resolve when async implemented
   ex_get_epoch(callingMod:IWasmModule|IWasmModuleAsync, eventID: number) {
      const date = Date.now();

      return date;
   }

   // callingMod.wasmMem should be used to access module memory
   // because this function is not async, "put" methods can not be used (they await in the IWasmModuleAsync versions)
   // TODO!! this will be resolve with async implementation
   ex_append_two_strings(callingMod:IWasmModule|IWasmModuleAsync, str1Idx:number, str2Idx:number) {
      const newStr=callingMod.wasmMem.getString(str1Idx)+callingMod.wasmMem.getString(str2Idx);
      return callingMod.wasmMem.putString(newStr);
   }

}




