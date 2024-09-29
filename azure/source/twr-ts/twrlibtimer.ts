import {IWasmModule,} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"
import {twrLibrary, TLibImports, twrLibraryInstanceRegistry} from "./twrlibrary.js"

// Libraries use default export
export default class twrLibTimer extends twrLibrary {
   id: number;
   imports:TLibImports = {
      twr_timer_single_shot:{},
      twr_timer_repeat:{},
      twr_timer_cancel:{},
      twr_sleep:{isAsyncFunction: true, isModuleAsyncOnly: true},
   };

   libSourcePath = new URL(import.meta.url).pathname;

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   twr_timer_single_shot(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number, eventID:number) {
      return setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   twr_timer_repeat(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number, eventID:number) {
      return setInterval(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);  
   }  
   
   twr_timer_cancel(callingMod:IWasmModule|IWasmModuleAsync, timerID:number) {
      clearInterval(timerID);
   }

   async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number) {
      const p = new Promise<void>( (resolve)=>{
         setTimeout(()=>{ resolve() }, milliSeconds);  
      });

      return p;
   }

}



