import {IWasmModule} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"
import {twrWasmModuleAsyncProxy} from "./twrmodasyncproxy.js"
import {twrEventQueueReceive} from "./twreventqueue.js"

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// TODO List

// preinstalled library code should just exist once -- right now its duplicated in mod and modAsync
// Implement event loop processing (get_next_event, get_filter_event)
// Issue with above: how do I get the event parameters?
// implement event loop in twrWasmModule (currently only in twrWasmModuleAsync) ?
// Need better name collision prevention on imported functions
// This only supports one library instance load.  Support multiple library instance loads and "drivers" (like for consoles)
// current implementation has no libs: (akin to io:).  
// unify consoles into a library 
// add an import option: isWasmModuleOnly ?
// add an import option: isModuleAsyncFunctionOverride to cause code to execute directly instead of via RPC (eg. Date, Math)
// add isFireAndForget option for void functions in async module that don't need to wait for a response (like conlog)?
// add IWasmModuleBase ?
// Are too many inefficient tickleEventLoop being sent?
// add codepage arg to register callback?
// libraries register themselves.  should this happen?  see module loadWasm

// TODO DOC
// doc as module level getString, etc, as deprecated, use this.wasmMem
// doc that fetchAndPutURL is no longer a CallC option, and must be called manually


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export type TLibImports = { [key:string]: {isAsyncFunction?:boolean, isModuleAsyncOnly?:boolean, isCommonCode?:boolean}};
export type TLibraryProxyParams = ["twrLibraryProxy", libID:number, imports:TLibImports, libSourcePath:string|undefined];

// TLibraryMessage is sent from twrWasmModuleAsyncProxy (worker thread) to twrWasmModuleAsync
export type TLibraryMessage = ["twrLibrary", libID:number, funcName:string, isAsyncOverride:boolean, returnValueEventID:number, ...args:any[]];

/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

export abstract class twrLibrary  {
   id: number;
   static iExist:{[key:string]: boolean}={};  // used to check that only one instance of this class exists
   abstract imports: TLibImports;
   libSourcePath?: string;
   importsAsyncOverride:string[]=[];  // can be overridden by derived class

   constructor() {
      if (twrLibrary.iExist[this.constructor.name]) throw new Error("twrLibrary currently only supports a single instance of any Library")
      twrLibrary.iExist[this.constructor.name]=true;
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   // the actual twrLibrary can be created outside of a specific wasm module, so isn't paired to a specific module
   // however, each call to getImports is paired to a specific wasm module
   // getImports returns Wasm Module imports that will be added to this wasm module's WebAssembly.ModuleImports
   // getImports expects that the derived class has created a "this.import" with a list of function names (as strings)
   // getImports is called by twrWasmModule
   getImports(callingMod:IWasmModule) {
      if (!callingMod.isTwrWasmModule) throw new Error("unsupported module type");

      let wasmImports:{[key:string]: Function}={};
      const derivedInstanceThis=(this as unknown) as {[key:string]:(mod:IWasmModule, ...params:any)=>void};

      if (!this.imports) throw new Error("twrLibrary derived class is missing imports.");
      for (let funcName in this.imports) {
         if (this.imports[funcName].isModuleAsyncOnly) {
            const nullFun=() => {
               throw new Error("Invalid call to unimplemented twrLibrary 'import' function (isModuleAsyncOnly was used): "+funcName);
            }
            wasmImports[funcName]=nullFun;
         }
         else {
            if (!derivedInstanceThis[funcName]) 
               throw new Error("twrLibrary 'import' function is missing: "+funcName);
            wasmImports[funcName]=derivedInstanceThis[funcName].bind(this, callingMod);
         }
      }

      return wasmImports;
   }

   // this function is called by twrWasmModuleAsync, and sent to the corresponding twrWasmModuleAsyncProxy
   getProxyParams() : TLibraryProxyParams {
      return ["twrLibraryProxy", this.id, this.imports, this.libSourcePath];
   }

   // called by twrWasmModuleAsync
   async processMessageFromProxy(msg:TLibraryMessage, mod:IWasmModuleAsync) {
      const [msgClass, id, funcName, doAwait, returnValueEventID, ...params]=msg;
      if (id!=this.id) throw new Error("internal error");  // should never happen
      if (!mod.isTwrWasmModuleAsync) throw new Error("internal error");

      const derivedInstance=(this as unknown) as {[key:string]: ( (mod:IWasmModuleAsync|IWasmModule, ...params:any)=>any) };
      if (!derivedInstance[funcName]) throw new Error("twrLibrary derived class missing 'import' function: "+funcName);
      
      let retVal;
      if (doAwait)
         retVal=await derivedInstance[funcName](mod, ...params);
      else
         retVal=derivedInstance[funcName](mod, ...params);

      mod.eventQueueSend.postEvent(returnValueEventID, retVal);
   }   

}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export class twrLibraryProxy {
   id:number;
   imports: TLibImports;
   libSourcePath?:string;
   called=false;

   //every module instance has its own twrLibraryProxy

   constructor(params:TLibraryProxyParams) {
       const [className, id, imports, libSourcePath] = params;
       this.id=id;
       this.imports=imports;
       this.libSourcePath=libSourcePath;
   }

   private remoteProcedureCall(ownerMod:twrWasmModuleAsyncProxy, funcName:string, isAsyncFunction:boolean, returnValueEventID:number, ...args:any[]) {
      const msg:TLibraryMessage=["twrLibrary", this.id, funcName, isAsyncFunction, returnValueEventID, ...args];
      // postMessage sends message to the JS Main thread that created the twrModAsyncProxy thread
      // the message processing code discriminates the destination instance by:  "twrLibrary", this.id,
      postMessage(msg);
      //TODO!! a void return type isn't particularly supported -- it will presumably returned undefined from the JS function, 
      //which will put a zero into the Int32Array used for returnValue

      const [id, retVals]=ownerMod.eventQueueReceive.waitEvent(returnValueEventID);
      if (id!=returnValueEventID) throw new Error("internal error");
      if (retVals.length!=1) throw new Error("internal error"); 
      return retVals[0];
   }

   // getProxyImports is called by twrWasmModuleAsyncProxy
   // it provides the functions that the twrWasmModuleAsync's C code will call
   // these will RPC to the JS main thread and then wait for a return value (unless isCommonCode set)
   async getProxyImports(ownerMod:twrWasmModuleAsyncProxy) {
      if (this.called===true) throw new Error("getProxyImports should only be called once per twrLibraryProxy instance");
      this.called=true;

      let wasmImports:{[key:string]: Function}={};
      let libClass;

      // if isCommonCode, we need to dynamically load the code into this worker thread
      if (this.libSourcePath) {
         const url=new URL(this.libSourcePath, import.meta.url);
         const libMod=await import(url.pathname);
         libClass=new libMod.default;
      }

   // now for each twrLibrary import, create the functions that will be added to wasm module imports
   for (let funcName in this.imports) {

         if (this.imports[funcName].isCommonCode) {
            if (this.imports[funcName].isAsyncFunction) 
               throw new Error("isAsyncFunction can not be used with isCommonCode");
            if (this.libSourcePath===undefined) 
               throw new Error("undefined libSourcePath, but isCommonCode is set");
            wasmImports[funcName]=libClass[funcName].bind(libClass, ownerMod);
         }
         else {
            if (this.imports[funcName].isAsyncFunction) {
               wasmImports[funcName]=this.remoteProcedureCall.bind(this, ownerMod, funcName+"_async", this.imports[funcName].isAsyncFunction?true:false, twrEventQueueReceive.registerEvent());
            }
            else {
               wasmImports[funcName]=this.remoteProcedureCall.bind(this, ownerMod, funcName, this.imports[funcName].isAsyncFunction?true:false, twrEventQueueReceive.registerEvent());
            }
         }
      }

      return wasmImports;
   }
}

/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

// this is global in the JS main thread address space
// all libraries are registered here
export class twrLibraryInstanceRegistry {

   static libInstances: twrLibrary[]=[];

   // create a pairing between an instance of type ILibraryBase and an integer ID
   static register(libInstance:twrLibrary) {
      twrLibraryInstanceRegistry.libInstances.push(libInstance);
      return twrLibraryInstanceRegistry.libInstances.length-1;
   }

   static getLibraryInstance(id:number) {
      if (id<0 || id >= twrLibraryInstanceRegistry.libInstances.length)
         throw new Error("Invalid console ID: "+id);

      return twrLibraryInstanceRegistry.libInstances[id];
   }

   static getLibraryInstanceID(libInstance:twrLibrary) {
      for (let i=0; i<twrLibraryInstanceRegistry.libInstances.length; i++)
         if (twrLibraryInstanceRegistry.libInstances[i]==libInstance)
            return i;

      throw new Error("libInstance not in registry");
   }

}

// this is created in each twrWasmModuleAsyncProxy Worker thread
// if there are multiple twrWasmModuleAsyncProxy instances, there will one Registry in each Worker
export class twrLibraryInstanceProxyRegistry {

   static libProxyInstances: twrLibraryProxy[]=[];

   // create a pairing between an instance of type IConsole and an integer ID
   static registerProxy(libProxyInstance:twrLibraryProxy) {
      twrLibraryInstanceProxyRegistry.libProxyInstances[libProxyInstance.id]=libProxyInstance;
      return libProxyInstance.id;
   }

   static getLibraryInstanceProxy(id:number) {
      if (id<0 || id >= twrLibraryInstanceProxyRegistry.libProxyInstances.length)
         throw new Error("Invalid console ID: "+id);

      return twrLibraryInstanceProxyRegistry.libProxyInstances[id];
   }

   static getLibraryInstanceID(libProxyInstance:twrLibraryProxy) {
      for (let i=0; i<twrLibraryInstanceProxyRegistry.libProxyInstances.length; i++)
         if (twrLibraryInstanceProxyRegistry.libProxyInstances[i]==libProxyInstance)
            return i;

      throw new Error("libProxyInstance not in registry");
   }

}