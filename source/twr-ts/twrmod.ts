import {parseModOptions, IModOpts} from "./twrmodutil.js"
import {twrTimeEpochImpl} from "./twrdate.js"
import {twrTimeTmLocalImpl, twrUserLconvImpl, twrUserLanguageImpl, twrRegExpTest1252Impl,twrToLower1252Impl, twrToUpper1252Impl} from "./twrlocale.js"
import {twrStrcollImpl, twrUnicodeCodePointToCodePageImpl, twrCodePageToUnicodeCodePoint, twrGetDtnamesImpl} from "./twrlocale.js"
import {IConsole, logToCon} from "./twrcon.js"
import {twrConsoleRegistry} from "./twrconreg.js"
import {twrLibraryInstanceRegistry} from "./twrlibrary.js";
import {IWasmMemory, twrWasmMemory} from './twrwasmmem.js'
import {twrFloatUtil} from "./twrfloat.js";
import {twrWasmCall} from "./twrwasmcall.js"
import {twrWasmBase} from "./twrwasmbase.js"


/*********************************************************************/

// Partial<IWasmMemory> defines the deprecated, backwards compatible 
// memory access APIs that are at the module level.  
// New code should use wasmMem.
export interface IWasmModule extends Partial<IWasmMemory> {
   loadWasm: (pathToLoad:string)=>Promise<void>;
   wasmMem: IWasmMemory;
   callCInstance: twrWasmCall;
   callC:twrWasmCall["callC"];
   fetchAndPutURL: (fnin:URL)=>Promise<[number, number]>;
   divLog:(...params: string[])=>void;
}

/*********************************************************************/

export class twrWasmModule extends twrWasmBase implements IWasmModule {
   private cpTranslate:twrCodePageToUnicodeCodePoint;
   io:{[key:string]: IConsole};
   ioNamesToID: {[key: string]: number};
   unqiueInt:number=1;
   onEvent:Function[]=[];

   // divLog is deprecated.  Use IConsole.putStr
   divLog:(...params: string[])=>void;

   // IWasmMemory
   // These are deprecated, use wasmMem instead.
   memory!:WebAssembly.Memory;
   mem8!:Uint8Array;
   mem32!:Uint32Array;
   memD!:Float64Array;
   stringToU8!:(sin:string, codePage?:number)=>Uint8Array;
   copyString!:(buffer:number, buffer_size:number, sin:string, codePage?:number)=>void;
   getLong!:(idx:number)=>number;
   setLong!:(idx:number, value:number)=>void;
   getDouble!:(idx:number)=>number;
   setDouble!:(idx:number, value:number)=>void;
   getShort!:(idx:number)=>number;
   getString!:(strIndex:number, len?:number, codePage?:number)=>string;
   getU8Arr!:(idx:number)=>Uint8Array;
   getU32Arr!:(idx:number)=>Uint32Array;

   malloc!:(size:number)=>number;
   free!:(size:number)=>void;
   putString!:(sin:string, codePage?:number)=>number;
   putU8!:(u8a:Uint8Array)=>number;
   putArrayBuffer!:(ab:ArrayBuffer)=>number;

   /*********************************************************************/

   constructor(opts:IModOpts={}) {
      super();
      [this.io, this.ioNamesToID] = parseModOptions(opts);
      this.divLog=logToCon.bind(undefined, this.io.stdio);
      this.cpTranslate=new twrCodePageToUnicodeCodePoint();
   }

   /*********************************************************************/

   async loadWasm(pathToLoad:string) {

      const conCall = (funcName: keyof IConsole, jsid:number, ...args: any[]):any => {
         const con=twrConsoleRegistry.getConsole(jsid);
         const f=con[funcName] as (...args: any[]) => any;
         if (!f) throw new Error(`Likely using an incorrect console type. jsid=${jsid}, funcName=${funcName}`);
         return f.call(con, ...args);
      }

      const conSetRange = (jsid:number, chars:number, start:number, len:number) => {
         let values=[];
         for (let i=start; i<start+len; i++) {
            values.push(this.wasmMem!.getLong(i));
         }
         conCall("setRange", jsid, start, values);
      }

      const conPutStr = (jsid:number, chars:number, codePage:number) => {
         conCall("putStr", jsid, this.wasmMem!.getString(chars), codePage);
      }

      const conGetProp = (jsid:number, pn:number):number => {
         const propName=this.wasmMem!.getString(pn);
         return conCall("getProp", jsid, propName);
      }

      const conDrawSeq = (jsid:number, ds:number) => {
         conCall("drawSeq", jsid, ds, this.wasmMem);
      }

      const twrGetConIDFromNameImpl = (nameIdx:number):number => {
         const name=this.wasmMem!.getString(nameIdx);
         const id=this.ioNamesToID[name];
         if (id)
            return id;
         else
            return -1;
      }

      // TODO!!! ? This implementation assume each library has exactly one instance
      // TODO!!! ? current implementation has no libs: (akin to io).  
      let imports:WebAssembly.ModuleImports={};
      for (let i=0; i<twrLibraryInstanceRegistry.libInstances.length; i++) {
         const lib=twrLibraryInstanceRegistry.libInstances[i];
         imports={...imports, ...lib.getImports(this)};
      }

      const nullFun=() => {
         throw new Error("call to unimplemented twrXXX import in twrWasmModule.  Use twrWasmModuleAsync ?");
      }

      const wasmMemFuncCall = (func: Function, ...params:any[]) => {
         return func.call(this.wasmMem, ...params);
      }

      const floatUtil=new twrFloatUtil();
   
       imports={
         ...imports,
         twrTimeEpoch:twrTimeEpochImpl,
         twrTimeTmLocal:wasmMemFuncCall.bind(null, twrTimeTmLocalImpl),
         twrUserLconv:wasmMemFuncCall.bind(null, twrUserLconvImpl),
         twrUserLanguage:wasmMemFuncCall.bind(null, twrUserLanguageImpl),
         twrRegExpTest1252:wasmMemFuncCall.bind(null, twrRegExpTest1252Impl),
         twrToLower1252:wasmMemFuncCall.bind(null, twrToLower1252Impl),
         twrToUpper1252:wasmMemFuncCall.bind(null, twrToUpper1252Impl),
         twrStrcoll:wasmMemFuncCall.bind(null, twrStrcollImpl),
         twrUnicodeCodePointToCodePage:wasmMemFuncCall.bind(null, twrUnicodeCodePointToCodePageImpl),
         twrGetDtnames:wasmMemFuncCall.bind(null, twrGetDtnamesImpl),
         twrCodePageToUnicodeCodePoint:this.cpTranslate.convert.bind(this.cpTranslate),
         twrGetConIDFromName: twrGetConIDFromNameImpl,

         twr_register_callback:this.registerCallback.bind(this), 

         twrConCharOut:conCall.bind(null, "charOut"),
         twrConCharIn:nullFun,
         twrSetFocus:nullFun,

         twrConGetProp:conGetProp,
         twrConCls:conCall.bind(null, "cls"),
         twrConSetC32:conCall.bind(null, "setC32"),
         twrConSetReset:conCall.bind(null, "setReset"),
         twrConPoint:conCall.bind(null, "point"),
         twrConSetCursor:conCall.bind(null, "setCursor"),
         twrConSetColors:conCall.bind(null, "setColors"),
         twrConSetRange:conSetRange,
         twrConPutStr:conPutStr,

         twrConDrawSeq:conDrawSeq,
         
         twrCanvasCharIn:nullFun,
         twrCanvasInkey:nullFun,
         twrSleep:nullFun,

         twrSin:Math.sin,
         twrCos:Math.cos,
         twrTan: Math.tan,
         twrFAbs: Math.abs,
         twrACos: Math.acos,
         twrASin: Math.asin,
         twrATan: Math.atan,
         twrExp: Math.exp,
         twrFloor: Math.floor,
         twrCeil: Math.ceil,
         twrFMod: function(x:number, y:number) {return x%y},
         twrLog: Math.log,
         twrPow: Math.pow,
         twrSqrt: Math.sqrt,
         twrTrunc: Math.trunc,

         twrDtoa: floatUtil.dtoa.bind(floatUtil),
         twrToFixed: floatUtil.toFixed.bind(floatUtil),
         twrToExponential: floatUtil.toExponential.bind(floatUtil),
         twrAtod: floatUtil.atod.bind(floatUtil),
         twrFcvtS: floatUtil.fcvtS.bind(floatUtil),
      }

      await super.loadWasm(pathToLoad, imports);

      floatUtil.mem=this.wasmMem;

      if (!(this.wasmMem.memory.buffer instanceof ArrayBuffer))
         console.log("twrWasmModule does not require shared Memory. Okay to remove wasm-ld --shared-memory --no-check-features");

      // backwards compatible
      // TODO!! doc as deprecated, use this.wasmMem
      this.memory = this.wasmMem!.memory;
      this.mem8 = this.wasmMem!.mem8;
      this.mem32 = this.wasmMem!.mem32;
      this.memD = this.wasmMem!.memD;
      this.malloc = this.wasmMem!.malloc;
      this.free = this.wasmMem!.free;
      this.stringToU8=this.wasmMem!.stringToU8;
      this.copyString=this.wasmMem!.copyString;
      this.getLong=this.wasmMem!.getLong;
      this.setLong=this.wasmMem!.setLong;
      this.getDouble=this.wasmMem!.getDouble;
      this.setDouble=this.wasmMem!.setDouble;
      this.getShort=this.wasmMem!.getShort;
      this.getString=this.wasmMem!.getString;
      this.getU8Arr=this.wasmMem!.getU8Arr;
      this.getU32Arr=this.wasmMem!.getU32Arr;
   
      this.putString=this.wasmMem!.putString;
      this.putU8=this.wasmMem!.putU8;
      this.putArrayBuffer=this.wasmMem!.putArrayBuffer;

      // init C runtime
      const init=this.exports.twr_wasm_init as Function;
      init(this.ioNamesToID.stdio, this.ioNamesToID.stderr, this.ioNamesToID.std2d==undefined?-1:this.ioNamesToID.std2d, this.wasmMem.mem8.length);
   }
   
   /*********************************************************************/

   // given a url, load its contents, and stuff into Wasm memory similar to Unint8Array
   // TODO!! Doc that this is no longer a CallC option, and must be called here manually
   async fetchAndPutURL(fnin:URL):Promise<[number, number]> {

      if (!(typeof fnin === 'object' && fnin instanceof URL))
         throw new Error("fetchAndPutURL param must be URL");

      try {
         let response=await fetch(fnin);
         let buffer = await response.arrayBuffer();
         let src = new Uint8Array(buffer);
         let dest=this.wasmMem.putU8(src);
         return [dest, src.length];
         
      } catch(err:any) {
         console.log('fetchAndPutURL Error. URL: '+fnin+'\n' + err + (err.stack ? "\n" + err.stack : ''));
         throw err;
      }
   }

   //!! events:Map<string, TLibraryEvent>;
   //!! this.events=new Map;

   //see twrWasmModule.constructor - imports - twr_register_callback:this.registerCallback.bind(this), 
   registerCallback(funcNameIdx:number) {
      //TODO!! Should i accept a code page argument??
      const funcName=this.getString(funcNameIdx);
      const onEvent = this.exports[funcName] as Function;
      if (!onEvent) throw new Error("registerCallback called with a function name that is not exported from the modul.e")
      this.onEvent[++this.unqiueInt]=onEvent;
      return this.unqiueInt;
   }

   postEvent(eventID:number, ...params:any[]) {
      if (this instanceof twrWasmModule) {
         this.onEvent[eventID](eventID, ...params);
      }
      //TODO!! finish postEvent code -- if not callback registered, add to event loop
      //this.events.set(eventName, args);
      else {
         throw new Error("TODO!! only twrWasmModule currently implemented");
      }
   }

   peekEvent(eventName:string) {
      // get earliest inserted entry in event Map
      //const ev=this.events.get(eventName)
   }
  // called (RPC) by twrLibraryProxy
  // waitEvent(eventName:string) {
  //    const evIdx=peekTwrEvent(eventName);
  //    if (evIdx) {
  //       this.returnValue!.write(evIdx);
  //    }
  //    else {
  //       this.addEventListner(eventName, (evIdx:number)=> {
  //          this.returnValue!.write(evIdx);
  //       });
  //    }
}




