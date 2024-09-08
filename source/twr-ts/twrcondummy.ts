import {IConsoleStreamOut, IConsoleStreamIn, IConsoleCanvas, IConsoleAddressable, ICanvasProps } from "./twrcon.js"
import {IWasmModuleAsync} from "./twrmodasync.js";
import {IWasmModule} from "./twrmod.js"
import {twrLibrary, TLibImports, twrLibraryInstanceRegistry} from "./twrlibrary.js";

// This class exists so the twrlibbuiltin can cause all functions (like twrConCls) to resolve at link time
// twr.a links to all of these, even if the relevant console is not loaded by the app at runtime
// TODO!! remove this hack

export default class twrConsoleDummy extends twrLibrary implements IConsoleStreamIn, IConsoleStreamOut, IConsoleAddressable, IConsoleCanvas  {
   id:number;

   imports:TLibImports = {
      twrConCharOut:{noBlock:true},
      twrConGetProp:{},
      twrConPutStr:{noBlock:true},
      twrConCharIn:{isAsyncFunction: true, isModuleAsyncOnly: true},
      twrConSetFocus:{noBlock:true},
      twrConSetC32:{noBlock:true},
      twrConCls:{noBlock:true},
      twrConSetRange:{noBlock:true},
      twrConSetReset:{noBlock:true},
      twrConPoint:{},
      twrConSetCursor:{noBlock:true},
      twrConSetCursorXY:{noBlock:true},
      twrConSetColors:{noBlock:true},
      twrConDrawSeq:{},
      twrConLoadImage:{isModuleAsyncOnly:true, isAsyncFunction:true},
   };

   libSourcePath = new URL(import.meta.url).pathname;
   interfaceName = "twrConsole";

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }
   
   twrConGetProp(callingMod:IWasmModule|IWasmModuleAsync, pn:number):number {
      throw new Error("internal error");
   }

   keyDown(ev:KeyboardEvent)  {
      throw new Error("internal error");
   }

   twrConCharOut(callingMod:any, c:number, codePage:number)  {
      throw new Error("internal error");
   }

   twrConPutStr(callingMod:IWasmModule|IWasmModuleAsync, chars:number, codePage:number) {
      throw new Error("internal error");
   }

   twrConSetC32(callingMod:any, location:number, c32:number) : void {
      throw new Error("internal error");
   }

   twrConCls()  {
      throw new Error("internal error");
   }

   twrConSetRange(callingMod:IWasmModule|IWasmModuleAsync, chars:number, start:number, len:number) {
      throw new Error("internal error");
   }

   setRangeJS(start:number, values:number[]) {
      throw new Error("internal error");
   }

   twrConSetReset(callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number, isset:boolean) : void  {
      throw new Error("internal error");
   }

   twrConPoint(callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number) : boolean  {
      throw new Error("internal error");
   }

   twrConSetCursor(callingMod:IWasmModule|IWasmModuleAsync, location:number) : void   {
      throw new Error("internal error");
   }

   twrConSetCursorXY(callingMod:IWasmModule|IWasmModuleAsync, x:number, y:number) {
      throw new Error("internal error");
   }

   twrConSetColors(callingMod:IWasmModule|IWasmModuleAsync, foreground:number, background:number) : void {
      throw new Error("internal error");
   }

   async twrConCharIn_async(callingMod: IWasmModuleAsync):Promise<number> {
      throw new Error("internal error");
   }

   twrConSetFocus() {
      throw new Error("internal error");
   }

   twrConDrawSeq(mod:IWasmModuleAsync|IWasmModule, ds:number) {
      throw new Error("internal error");
   }

   getProp(name:keyof ICanvasProps): number {
      throw new Error("internal error");
   }

   putStr(str:string) {
      throw new Error("internal error");
   }

   charOut(c32:string) {
      throw new Error("internal error");
   }

   twrConLoadImage_async(mod: IWasmModuleAsync, urlPtr: number, id: number) : Promise<number> {
      throw new Error("internal error");
   }

}
