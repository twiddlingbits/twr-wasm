import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports, twrLibraryInstanceRegistry} from "twr-wasm"

// Libraries use default export
export default class jsEventsLib extends twrLibrary {
   id: number;

   imports:TLibImports = {
      registerKeyUpEvent: {},
      registerKeyDownEvent: {},
      registerAnimationLoop: {},
      registerMousePressEvent: {},
      registerMouseMoveEvent: {},

      setElementText: {},
   };

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor() {
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }

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

   registerMouseMoveEvent(callingMod:IWasmModule|IWasmModuleAsync, eventID: number, elementIDPtr: number, relative: boolean) {
      const elementID = callingMod.wasmMem.getString(elementIDPtr);
      const element = document.getElementById(elementID)!;

      if (element == null) throw new Error("registerMouseEvent was given a non-existant element ID!");

      if (relative) {
         const x_off = element.offsetLeft;
         const y_off = element.offsetTop;
         element.addEventListener('mousemove', (e) => {
            callingMod.postEvent(eventID, e.clientX - x_off, e.clientY - y_off);
         });
      } else {
         element.addEventListener('mousemove', (e) => {
            callingMod.postEvent(eventID, e.clientX, e.clientY);
         });
      }
   }

   registerMousePressEvent(callingMod:IWasmModule|IWasmModuleAsync, eventID: number, elementIDPtr: number, relative: boolean) {
      const elementID = callingMod.wasmMem.getString(elementIDPtr);
      const element = document.getElementById(elementID)!;

      if (element == null) throw new Error("registerMouseEvent was given a non-existent element ID!");

      if (relative) {
         const x_off = element.offsetLeft;
         const y_off = element.offsetTop;
         element.addEventListener('mousedown', (e) => {
            callingMod.postEvent(eventID, e.clientX - x_off, e.clientY - y_off, e.button);
         });
      } else {
         element.addEventListener('mousedown', (e) => {
            callingMod.postEvent(eventID, e.clientX, e.clientY, e.button);
         });
      }
   }

   setElementText(mod:IWasmModule|IWasmModuleAsync, elementIDPtr: number, textPtr: number) {
      const elementID = mod.wasmMem.getString(elementIDPtr);
      const text = mod.wasmMem.getString(textPtr);

      const element = document.getElementById(elementID)!;
      if (!element) throw new Error(`setElementText was given an invalid ID (${elementID})`);

      element.innerText = text;
   }

}


