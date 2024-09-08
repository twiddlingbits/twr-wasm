import {IWasmModule, IWasmModuleAsync, twrLibrary, keyEventToCodePoint, TLibImports, twrLibraryInstanceRegistry} from "twr-wasm"

// Libraries use default export
export default class twrLibExample extends twrLibrary {
   id:number;

   imports:TLibImports = {
      ex_listen_key_events:{},
      ex_single_shot_timer:{},
      ex_get_epoch:{},
      ex_append_two_strings:{isAsyncFunction: true},
      ex_sleep:{isAsyncFunction: true, isModuleAsyncOnly: true},
   };

   // every library should have this line
   libSourcePath = new URL(import.meta.url).pathname;

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   // Because this function is in the imports list above, it will be added to the imports list for
   // both twrWasmModule and twrWasmModuleAsyncProxy.
   // The callingMod argument is added by twrLibrary, it is not passed by the caller C function.
   //
   // imported functions always run in the JavaScript Main thread.  So if your C code is executing in a twrWasmModuleAsyncProxy
   // worker thread, a C call to an import twrLibrary function will result in a remote procedure call into twrWasmModuleAsync, 
   // which calls this function.  
   //
   // An eventID is retrieved by the C function calling twr_register_callback, which is implemented by twrWasmLibrary
   ex_listen_key_events(callingMod:IWasmModule|IWasmModuleAsync, eventID:number) {

      const keyEventListner = (event:KeyboardEvent) => {
         const r=keyEventToCodePoint(event);  // twr-wasm utility function
         if (r) {
            // postEvent can only post numbers -- no translation of arguments is performed prior to making the C event callback
            // currently only int32 is supported (which can be a pointer)
            // See ex_append_two_strings below for an example using strings.
            callingMod.postEvent(eventID, r);
         }
       }

      document.addEventListener('keydown', keyEventListner);
   }

   ex_single_shot_timer(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   ex_get_epoch(callingMod:IWasmModule|IWasmModuleAsync, eventID: number) {
      const date = Date.now();

      return date;
   }

   // Two versions of ex_append_two_strings are implemented in this example -- an "extra" one that uses the "async" function keyword.
   // Because this function is added to imports with the option isAsyncFunction, when called by twrWasmModuleAsyncProxy, 
   // ex_append_two_strings_async will be called with await (instead of ex_append_two_strings called with no await, the default).
   // Note that when adding the function name to imports with the option isAsyncFunction, you use a single import with 
   // the base import name.   The "_async" addition will be used as needed by the import logic.
   //
   // callingMod.wasmMem can be used to access module memory.   WasmMemoryAsync will be passed if the calling module is twrWasmModuleAsync,
   // while WasmMemory will be passed if the calling module is a twrWasmModule.
   // "WasmMemoryAsync.putXX", are async functions, while "WasmMemory.putXX" are not.
   // Thus a possible reason to use isAsyncFunction is to make a call to put memory functions like "await callingMod.wasmMem.putString".
   // Functions like "callingMod.wasmMem.getString" are not async and thus do not need the option "isAsyncFunction".
   ex_append_two_strings(callingMod:IWasmModule, str1Idx:number, str2Idx:number) {
      const newStr=callingMod.wasmMem.getString(str1Idx)+callingMod.wasmMem.getString(str2Idx);
      const rv=callingMod.wasmMem.putString(newStr);
      return rv;
   }
   
   async ex_append_two_strings_async(callingMod:IWasmModuleAsync, str1Idx:number, str2Idx:number) {
      const newStr=callingMod.wasmMem.getString(str1Idx)+callingMod.wasmMem.getString(str2Idx);
      const rv=await callingMod.wasmMem.putString(newStr);
      return rv;
   }

   // this function ex_sleep has two options set in its imports: isAsyncFunction, isModuleAsyncOnly.  The result is that:
   // (a) ex_sleep_async can/must use the async function keyword (similar to ex_append_two_strings), and 
   // (b) this function will not be available when using twrWasmModule (in other words, twrWasmModuleAsync must be used)
   // These options are set because ex_sleep_async is a blocking function.  That is, the C code will block when calling ex_sleep, until it returns.
   // This is in contrast to ex_single_shot_timer, which returns immediately to the C code, but then sends an event when the timer if complete.
   // Thus ex_single_shot_timer can be used in both twrWasmModule and twrWasmModuleAsync.
   async ex_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number) {
      const p = new Promise<void>( (resolve)=>{
         setTimeout(()=>{ resolve() }, milliSeconds);  
      });

      return p;
   }

   //TODO!! add twr_register_event
   //TODO!! I tired adding isAsyncProxyOverride, but it presents the difficulty function to call (which is derived from twrLibrary), is not accessible to twrLibraryProxy.  Consider dynamic import?
}


