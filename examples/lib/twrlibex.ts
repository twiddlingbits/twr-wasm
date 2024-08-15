import {twrLibrary} from "twr-wasm"
import {keyEventProcess} from "twr-wasm"
import {twrWasmModule} from "twr-wasm";

export class twrLibraryExample extends twrLibrary {
   imports = ["ex_listen_key_events", "ex_single_shot_timer", "ex_get_epoch", "ex_append_two_strings"];

   constructor () {
      super();
   }

   ex_listen_key_events(callingMod:twrWasmModule, eventID:number) {

      const keyEventListner = (event:KeyboardEvent) => {
         const r=keyEventProcess(event);
         if (r) {
            callingMod.postEvent(eventID, r);
            //document.removeEventListener('keydown', keyEventListner);
         }
       }

      document.addEventListener('keydown', keyEventListner);
   }

   ex_single_shot_timer(callingMod:twrWasmModule, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   //TODO!! This case is incomplete.  No message posted so blocking version doesn't wait for a response.
   ex_get_epoch(callingMod:twrWasmModule, eventID: number) {
      const date = Date.now();

      return date;
   }

   ex_append_two_strings(callingMod:twrWasmModule, str1Idx:number, str2Idx:number) {
      const newStr=callingMod.wasmMem.getString(str1Idx)+callingMod.wasmMem.getString(str2Idx);
      return callingMod.wasmMem.putString(newStr);
   }


}




