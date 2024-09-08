import {IWasmModule} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"
import {twrWasmModuleAsyncProxy} from "./twrmodasyncproxy.js"
import {twrEventQueueReceive} from "./twreventqueue.js"

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// TODO List

// change conterm example to use debug -- either change back, or change index description
// termcon helloworld test repeatedly calls setFillStyleRGB with same color.  Add to optimization? Assign to Johnathon.
// deal with twrConGetIDFromNameImpl
// BUG - precomputed objects should be unique for each module that using this twrConsoleCanvas// setFocus is not  isModuleAsyncOnly, yet is defined in ConsoleStreamIn -- which is async only. 
// add isFireAndForget to setFocus and others as needed
// change callingMod:IWasmModule|IWasmModuleAsync to IWasmBase ?
// add IWasmBase instead of using twrWasmBase
// add IWasmModuleBase ?
// Consider and handle app exit (stop events from being posted post app exit)
// Add postEvent example that includes arguments
// finish new twrLibTimer APIS - C side, doc, etc.  
// Implement event loop processing (get_next_event, get_filter_event)
// Issue with above: how do I get the event parameters?
// implement event loop in twrWasmModule (currently only in twrWasmModuleAsync) ?
// Need better name collision prevention on imported functions
// current implementation has no libs: (akin to io:).  
// Are too many inefficient tickleEventLoop being sent?
// add codepage arg to register callback?

// TODO DOC
// doc as module level getString, etc, as deprecated, use this.wasmMem
// doc that fetchAndPutURL is no longer a CallC option, and must be called manually
// doc update putStr (vs putStr)


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export type TLibImports = { [key:string]: {isAsyncFunction?:boolean, isModuleAsyncOnly?:boolean, isCommonCode?:boolean, isFireAndForget?:boolean}};
export type TLibraryProxyParams = ["twrLibraryProxy", libID:number, imports:TLibImports, libSourcePath:string, multipleInstanceAllowed: boolean];

// TLibraryMessage is sent from twrWasmModuleAsyncProxy (worker thread) to twrWasmModuleAsync
export type TLibraryMessage = ["twrLibrary", libID:number, funcName:string, isAsyncOverride:boolean, returnValueEventID:number, ...args:any[]];

/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

export abstract class twrLibrary  {
   id: number;

   // must be set by derived class to describe each library function.  See docs.
   abstract imports: TLibImports;

   // libSourcePath must be set like this:
   //    use "libSourcePath = new URL(import.meta.url).pathname" 
   //    above works for both bundled and unbundled -- at least with parcel
   //    example: "/lib-js/twrlibmath.js" 
   abstract libSourcePath: string;

   // this must be set to false when only one instance of library is allowed, or
   // set to true if multiple allowed (e.g. consoles).  When true, APIs will expect first arg to be library ID.
   abstract multipleInstanceAllowed:boolean;

   constructor() {
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   // the actual twrLibrary is created outside of a specific wasm module, so isn't paired to a specific module
   // however, each call to getImports is paired to a specific wasm module
   // getImports returns Wasm Module imports that will be added to this wasm module's WebAssembly.ModuleImports
   // getImports expects that the derived class has created a "this.import" with a list of function names (as strings)
   // getImports is called by twrWasmModule
   getImports(callingMod:IWasmModule) {
      if (callingMod.isTwrWasmModuleAsync) throw new Error("unsupported module type (expecting twrWasmModule");

      let wasmImports:{[key:string]: Function}={};
      const derivedInstanceThis=(this as unknown) as {[key:string]:(mod:IWasmModule, ...params:any)=>void};

      if (this.imports===undefined) throw new Error("twrLibrary derived class is missing imports.");
      if (this.libSourcePath===undefined) throw new Error("twrLibrary derived class is missing libSourcePath.");
      if (this.multipleInstanceAllowed===undefined) throw new Error("twrLibrary derived class is missing multipleInstanceAllowed: "+this.libSourcePath);
      
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

            if (this.multipleInstanceAllowed) {
               // in this case, this particular instance represents the class
               // but the actual instance needs to be retrieved at runtime using the libID & registry
               // since only once set of WasmImports is created for each class

               const libFunc = (funcName: string, mod:IWasmModule, libID:number, ...params: any[]):any => {
                  const lib=twrLibraryInstanceRegistry.getLibraryInstance(libID);
                  const derivedLib=(lib as unknown) as {[key:string]:(callingMod:IWasmModule, ...params:any)=>void};
                  const f=derivedLib[funcName];
                  if (!f) throw new Error(`Library function not found. id=${libID}, funcName=${funcName}`);
                  return f.call(derivedLib, mod, ...params);
               }
               
               wasmImports[funcName]=libFunc.bind(null, funcName, callingMod);  // rest of function args are also passed to libFunc when using bind
            }
            else {
               wasmImports[funcName]=derivedInstanceThis[funcName].bind(this, callingMod);
            }
         }
      }

      return wasmImports;
   }

   // this function is called by twrWasmModuleAsync, and sent to the corresponding twrWasmModuleAsyncProxy
   getProxyParams() : TLibraryProxyParams {
      return ["twrLibraryProxy", this.id, this.imports, this.libSourcePath, this.multipleInstanceAllowed];
   }

   // called by twrWasmModuleAsync
   async processMessageFromProxy(msg:TLibraryMessage, mod:IWasmModuleAsync) {
      const [msgClass, libID, funcName, doAwait, returnValueEventID, ...params]=msg;
      if (this.multipleInstanceAllowed && twrLibraryInstanceRegistry.getLibraryInstance(libID).libSourcePath!=this.libSourcePath)
            throw new Error("internal error");  // should never happen
      else if (libID!=this.id) throw new Error("internal error");  // should never happen
      
      if (!mod.isTwrWasmModuleAsync) throw new Error("internal error");

      const libThis=twrLibraryInstanceRegistry.getLibraryInstance(libID);
      const derivedInstance=(libThis as unknown) as {[key:string]: ( (mod:IWasmModuleAsync|IWasmModule, ...params:any[])=>any) };
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
   libSourcePath:string;
   multipleInstanceAllowed:boolean;
   called=false;

   //every module instance has its own twrLibraryProxy

   constructor(params:TLibraryProxyParams) {
       const [className, id, imports, libSourcePath, multipleInstanceAllowed] = params;
       this.id=id;
       this.imports=imports;
       this.libSourcePath=libSourcePath;
       this.multipleInstanceAllowed=multipleInstanceAllowed;
   }

   private remoteProcedureCall(ownerMod:twrWasmModuleAsyncProxy, funcName:string, isAsyncFunction:boolean, returnValueEventID:number, multipleInstanceAllowed:boolean, ...args:any[]) {
      let msg:TLibraryMessage;

      if (multipleInstanceAllowed)
         msg=["twrLibrary", args[0], funcName, isAsyncFunction, returnValueEventID, ...args.slice(1)];
      else
         msg=["twrLibrary", this.id, funcName, isAsyncFunction, returnValueEventID, ...args];

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

   // now for each twrLibrary import, create the functions that will be added to wasm module imports
   for (let funcName in this.imports) {

         if (this.imports[funcName].isCommonCode) {
            if (this.imports[funcName].isAsyncFunction) 
               throw new Error("isAsyncFunction can not be used with isCommonCode");
            if (libClass===undefined) {
               if (this.libSourcePath===undefined) 
                  throw new Error("undefined libSourcePath");
               const libMod=await import(this.libSourcePath);
               libClass=new libMod.default;
            }
            wasmImports[funcName]=libClass[funcName].bind(libClass, ownerMod);
         }
         else {
            if (this.imports[funcName].isAsyncFunction) {
               wasmImports[funcName]=this.remoteProcedureCall.bind(this, ownerMod, funcName+"_async", this.imports[funcName].isAsyncFunction?true:false, twrEventQueueReceive.registerEvent(), this.multipleInstanceAllowed);
            }
            else {
               wasmImports[funcName]=this.remoteProcedureCall.bind(this, ownerMod, funcName, this.imports[funcName].isAsyncFunction?true:false, twrEventQueueReceive.registerEvent(), this.multipleInstanceAllowed);
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

   // every twrLibrary instance goes here (new ...)
   static libInstances: twrLibrary[]=[];

   // Each unique class instance goes here (ie, only once per class)
   static libClassInstances: twrLibrary[]=[];

   // create a pairing between an instance of type ILibraryBase and an integer ID
   static register(libInstance:twrLibrary) {
      twrLibraryInstanceRegistry.libInstances.push(libInstance);
      const id=twrLibraryInstanceRegistry.libInstances.length-1;

      if (this.getLibraryClassInstance(libInstance)) {
         if (!libInstance.multipleInstanceAllowed)
            throw new Error("A second twrLibrary instance was registered but multipleInstanceAllowed===false")
      }
      else {
         twrLibraryInstanceRegistry.libClassInstances.push(libInstance);
      }

      return id;
   }

   static getLibraryInstance(id:number) {
      if (id<0 || id >= twrLibraryInstanceRegistry.libInstances.length)
         throw new Error("Invalid console ID: "+id);

      return twrLibraryInstanceRegistry.libInstances[id];
   }

   static getLibraryClassInstance(libInstance:twrLibrary) {
      for (let i=0; i<twrLibraryInstanceRegistry.libClassInstances.length; i++)
         if (twrLibraryInstanceRegistry.libClassInstances[i].libSourcePath==libInstance.libSourcePath)
            return i;
      
      return undefined;
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