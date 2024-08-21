import {IWasmModule,} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"
import {twrLibrary, TLibImports} from "./twrlibrary.js"

//TODO!! Add .h for twr_single_shot_timer, twr_single_repeat_timer, and doc

// Libraries use default export
export default class twrLibTimer extends twrLibrary {

   imports:TLibImports = {
      twr_timer_single_shot:{},
      twr_timer_repeat:{},
      twr_sleep:{isAsyncFunction: true, isModuleAsyncOnly: true},
   };

   twr_timer_single_shot(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   twr_timer_repeat(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);  
   }   

   async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number) {
      const p = new Promise<void>( (resolve)=>{
         setTimeout(()=>{ resolve() }, milliSeconds);  
      });

      return p;
   }

}



