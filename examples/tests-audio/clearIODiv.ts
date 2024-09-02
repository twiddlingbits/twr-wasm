import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports} from "twr-wasm"

// Libraries use default export
export default class clearIODivLib extends twrLibrary {

   imports:TLibImports = {
      clearIODiv: {},
   };

   clearIODiv(mod: IWasmModule|IWasmModuleAsync) {
      const ioDiv = document.getElementById("twr_iodiv");
      if (!ioDiv) throw new Error("clearIODiv couldn't find twr_iodiv!");

      ioDiv.innerText = "";
   }

}


