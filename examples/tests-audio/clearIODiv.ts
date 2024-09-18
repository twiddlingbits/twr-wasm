import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports, twrLibraryInstanceRegistry} from "twr-wasm"

// Libraries use default export
export default class clearIODivLib extends twrLibrary {
   id: number;

   imports:TLibImports = {
      clearIODiv: {},
   };

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   clearIODiv(mod: IWasmModule|IWasmModuleAsync) {
      const ioDiv = document.getElementById("twr_iodiv");
      if (!ioDiv) throw new Error("clearIODiv couldn't find twr_iodiv!");

      ioDiv.innerText = "";
   }

}


