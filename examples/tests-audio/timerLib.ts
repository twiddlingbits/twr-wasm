import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports} from "twr-wasm"

// Libraries use default export
export default class timerLib extends twrLibrary {

   imports:TLibImports = {
      setTimeout: {},
   };

   setTimeout(mod: IWasmModule|IWasmModuleAsync, eventID: number, time: number, args: number) {
      setTimeout(()=>{
         mod.postEvent(eventID, args)
      }, time);     
   }

}


