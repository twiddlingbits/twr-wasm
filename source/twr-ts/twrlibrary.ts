import {twrSharedCircularBuffer} from "./twrcircular.js"
import {TModAsyncMessage} from "./twrmodasyncproxy.js"
import {twrWasmBase} from "./twrwasmbase.js"
import {IWasmModule, twrWasmModule} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export type TLibraryProxyParams = ["twrLibraryProxy", libID:number, imports:string[], returnValye:SharedArrayBuffer];
export type TLibraryMessage = TModAsyncMessage;
export type TLibraryEvent = any[];

/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

export abstract class twrLibrary  {
   id: number;
   returnValue?: twrSharedCircularBuffer;
   static iExist:{[key:string]: boolean}={};
   abstract imports: string[];

   constructor() {
      if (twrLibrary.iExist[this.constructor.name]) throw new Error("twrLibrary currently only supports a single instance of any Library")
      twrLibrary.iExist[this.constructor.name]=true;
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   //TODO!!! Need better name collision prevention on imported functions
   //TODO!!! This only supports one library instance load.  Support multiple library instance loads and "drivers" (like for consoles)

   // the actual twrLibrary can be created outside of a specific wasm module, so isn't paired to a specific module
   // however, each call to getImports is paired to a specific wasm module
   // getImports returns Wasm Module imports that will be added to this wasm module's WebAssembly.ModuleExports
   // getImports expects that the derived class has created a "this.import" with a list of function names (as strings)
   // TODO!! libraries currently only tested with twrWasmModule.  Need to add more complete support for twrWasmModuleAsync
   // getImports s called by twrWasmModule
   getImports(callingMod:IWasmModule) {
      if (!(callingMod instanceof twrWasmModule)) throw new Error("unsupported module type");

      let wasmImports:{[key:string]: Function}={};
      const derivedInstanceThis=(this as unknown) as {[key:string]:(mod:IWasmModule, ...params:any)=>void};

      if (!this.imports) throw new Error("twrLibrary derived class is missing imports.");
      for (let i=0; i < this.imports.length; i++) {
         const funcName=this.imports[i];
         if (!derivedInstanceThis[funcName]) throw new Error("twrLibrary derived class has invalid entry in imports");
         wasmImports[funcName]=derivedInstanceThis[funcName].bind(this, callingMod);
      }

      return wasmImports;
   }

   //TODO!! Could use a simpler (not yet existing) class rather than twrSharedCircularBuffer for this use case
   getProxyParams() : TLibraryProxyParams {
      this.returnValue = new twrSharedCircularBuffer();  
      return ["twrLibraryProxy", this.id, this.imports, this.returnValue.sharedArray];
   }

   processMessageFromProxy(msg:TLibraryMessage, mod:IWasmModuleAsync) {
      const [msgClass, id, funcName, ...params]=msg;
      if (id!=this.id) throw new Error("internal error");  // should never happen
      if (!(mod instanceof twrWasmModule)) throw new Error("unsupported module type");

      const derivedInstance=(this as unknown) as {[key:string]: ( (mod:IWasmModuleAsync|IWasmModule, ...params:any)=>void) };
         derivedInstance[funcName](mod, ...params);
   }   

}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export class twrLibraryProxy {
   returnValue: twrSharedCircularBuffer;
   id:number;
   imports: string[];
   ownerMod?:twrWasmBase;

   //TODO!! Does className need to be sent?
   //every module instance has its own twrLibraryProxy

   constructor(params:TLibraryProxyParams) {
       const [className, id, imports, returnBuffer] = params;
       this.returnValue = new twrSharedCircularBuffer(returnBuffer);
       this.id=id;
       this.imports=imports;
   }

   private remoteProcedureCall(funcName:string, ...args:any[]) {
      const msg:TLibraryMessage=["twrLibrary", this.id, funcName, ...args];
      // postMessage sends message to the JS Main thread that created the twrModAsyncProxy thread
      // the message processing code discriminates the destination instance by:  "twrLibrary", this.id,
      postMessage(msg);
   }

   // getProxyImports is called by twrWasmModuleAsyncProxy
   getProxyImports(ownerMod:twrWasmBase) {
      if (this.ownerMod) throw new Error("getProxyImports should only be called once per twrLibraryProxy instance");
      this.ownerMod=ownerMod;

      let wasmImports:{[key:string]: Function}={};

      for (let i=0; i < this.imports.length; i++) {
         const funcName=this.imports[i];
         wasmImports[funcName]=this.remoteProcedureCall.bind(this, funcName);
      }

      return wasmImports;
   }

 //TODO!! waitEvent to proxy import object
  // waitEvent(eventNameIdx: number) {
  //    this.remoteProcedureCall("waitEvent", this.ownerMod!.getString(eventNameIdx));
  //    return this.returnValue.readWait();
  // }
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

      throw new Error("ILibraryBase not in registry");
   }

}

// this is created in each twrWasmModuleAsyncProxy Worker thread
// if there are multiple twrWasmModuleAsyncProxy instances, there will be multiple copies of this in each Worker
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

      throw new Error("ILibraryBaseProxy not in registry");
   }

}