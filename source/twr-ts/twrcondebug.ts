

import {IConsoleStreamOut, IOTypes} from "./twrcon.js"
import {twrCodePageToUnicodeCodePoint} from "./twrliblocale.js"
import {IWasmModuleAsync} from "./twrmodasync.js";
import {IWasmModule} from "./twrmod.js"
import {twrLibrary, TLibImports} from "./twrlibrary.js";

export class twrConsoleDebug extends twrLibrary implements IConsoleStreamOut {
   logline="";
   element=undefined;
   cpTranslate:twrCodePageToUnicodeCodePoint;

   imports:TLibImports = {
      twrConCharOut:{},
      twrConGetProp:{isCommonCode:true},
      twrConPutStr:{},
   };

   libSourcePath = new URL(import.meta.url).pathname;
   multipleInstanceAllowed = true;

   constructor() {
      super();
      this.cpTranslate=new twrCodePageToUnicodeCodePoint();
   }

   charOut(ch:string) {
      if (ch.length>1) 
         throw new Error("charOut takes an empty string or a single char string");

      if (ch==='\n') {  
         console.log(this.logline);	// ideally without a linefeed, but there is no way to not have a LF with console.log API.
         this.logline="";
      }
      else {
         this.logline=this.logline+ch;
         if (this.logline.length>=300) {
            console.log(this.logline);
            this.logline="";
         }
      }
   }

   twrConCharOut(callingMod:IWasmModule|IWasmModuleAsync, ch:number, codePage:number) {
      const char=this.cpTranslate.convert(ch, codePage);
      if (char>0) 
         this.charOut(String.fromCodePoint(char));
   }

   getPropJS(propName: string):number {
      if (propName==="type") return IOTypes.CHARWRITE;  
      console.log("twrConsoleDebug.getProp passed unknown property name: ", propName)
      return 0;
   }

   twrConGetProp(callingMod:IWasmModule|IWasmModuleAsync, pn:number):number {
      const propName=callingMod.wasmMem.getString(pn);
      return this.getPropJS(propName);
   }
   
   putStr(str:string) {
      for (let i=0; i < str.length; i++)
         this.charOut(str[i]);
   }

   twrConPutStr(callingMod:IWasmModule|IWasmModuleAsync,  chars:number, codePage:number) {
      this.putStr(callingMod.wasmMem.getString(chars, undefined, codePage));
   }

}

export default twrConsoleDebug;
