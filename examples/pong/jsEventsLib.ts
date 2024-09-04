import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports} from "twr-wasm"

// Libraries use default export
export default class jsEventsLib extends twrLibrary {

   imports:TLibImports = {
      registerKeyUpEvent: {},
      registerKeyDownEvent: {},
      registerAnimationLoop: {},
   };

   registerKeyUpEvent(callingMod:IWasmModule|IWasmModuleAsync, eventID: number) {
      const keyEventListner = (event:KeyboardEvent) => {
         const r=keyEventToCodePoint(event);  // twr-wasm utility function
         if (r) {
            console.log(event, r);
            callingMod.postEvent(eventID, r);
         }
       }

      document.addEventListener('keyup', keyEventListner);
   }

   registerKeyDownEvent(callingMod:IWasmModule|IWasmModuleAsync, eventID: number) {
      const keyEventListner = (event:KeyboardEvent) => {
         const r=keyEventToCodePoint(event);  // twr-wasm utility function
         if (r) {
            callingMod.postEvent(eventID, r);
         }
       }

      document.addEventListener('keydown', keyEventListner);
   }

   registerAnimationLoop(callingMod:IWasmModule|IWasmModuleAsync, eventID: number) {
      const loop: FrameRequestCallback = (time) => {
         callingMod.postEvent(eventID, time);
         requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
   }
}


