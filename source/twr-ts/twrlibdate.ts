import {IWasmModule} from "./twrmod.js"
import {twrWasmBase} from "./twrwasmbase.js"
import {twrLibrary, TLibImports} from "./twrlibrary.js";

//TODO!! Add more Date functions (as alternatives to std c lib)?

// add built-in Libraries (like this one) to twrLibBultins
// libraries use the default export
export default class twrLibDate extends twrLibrary {
   imports:TLibImports = {
      twrTimeEpoch:{isCommonCode: true}
   }

   libSourcePath = new URL(import.meta.url).pathname;
   multipleInstanceAllowed = false;

   // return ms since epoch as double
   twrTimeEpoch(callingMod:IWasmModule|twrWasmBase) {

      return Date.now();

   }
}

