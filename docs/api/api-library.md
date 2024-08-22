---
title: Use twrLibrary to Implement Wasm C/C++ API in JavaScript
description: twr-wasm allows you to implement new C/C++ APIs in JavaScript/TypeScrip using the twrLibrary TypeScript class.
---

# twr-wasm Libraries
twr-wasm Libraries are used to expose TypeScript code to C/C++ as C APIs.  All of the twr-wasm C APIs are implemented with twr-wasm libraries.  You can also use a library to implement your own APIS.

To implement a twr-wasm library you create a new TypeScript class that extends `class twrLibrary`.  `twrLibrary` also provides an event framework, allowing you to post events to WebAssembly C code.

twr-wasm Libraries support both `twrWasmModule` and `twrWasmModuleAsync`.

## Lib Example
See the `lib` example.  PUT LINK HERE

## Example twrLibrary - twrLibTimer
This twr-wasm library adds two new C APIs:

- `twr-timer_single_shot` - sends an event to C after the timer times out.
- `twr_sleep` - blocks for a period of time.

~~~js
import {IWasmModule,} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"
import {twrLibrary, TLibImports} from "./twrlibrary.js"

// Libraries use default export
export default class twrLibTimer extends twrLibrary {

   imports:TLibImports = {
      twr_timer_single_shot:{},
      twr_sleep:{isAsyncFunction: true, isModuleAsyncOnly: true},
   };

   // this function will work in both twrWasmModule and twrWasmModuleAsync
   twr_timer_single_shot(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   // this function will only work in twrWasmModuleAsync since it blocks the C caller.
   async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number) {
      const p = new Promise<void>( (resolve)=>{
         setTimeout(()=>{ resolve() }, milliSeconds);  
      });

      return p;
   }

}
~~~

## C Header Files
You need to create a C .h file for the new APIs you create in a twrLibrary.
TODO

## Registering your API
TO FILL IN
see twrLibBultins.ts

## imports
All TypeScript functions that you wish to import into a WebAssembly module as C APIS, should be listed in the `imports` object.

Each function in the `imports` object has optional options, that are primarily for use with `twrWasmModuleAsync` modules.

## Events
To receive an Event, the C code needs to register an event callback, and then pass the event ID to the function that will generate events.  Like this:

~~~c
__attribute__((export_name("on_timer")))
void on_timer(int event_id) {
   printf("timer callback 2 entered (event id=%d)\n", event_id);
}

__attribute__((export_name("twr_main")))
void twr_main() {
   int timer1=twr_register_callback("on_timer");
   ex_single_shot_timer(2000, timer);
~~~

In this example, `on_timer` will be called after 2 seconds.

`__attribute__((export_name("on_timer")))` is needed because this C function is exported out of the WebAssembly module and into the JavaScript code.  JavaScript needs to call this function.

## callingMod
Each function listed in the `import` section will be passed a module as the first parameter.  In general, a function should be written to handle being called either with `IWasmModule` or `IWasmModuleAsync` as the calling module interface ( `callingMod:IWasmModule|IWasmModuleAsync` ).  This is generally straight forward.  

Examples that might cause some extra work, and that are covered below, are:

- Implementing  blocking functions like `twr_sleep`
- Allocating memory, for example, to return a string

## Numbers Only
TO FILL IN

Parameters need to be numbers - no automatic parameter conversion

link to the parameters doc

## memWasm
The primary `callingMod` member function that you may need to use is `memWasm` (`callingMod.memWasm`).   `memWasm` is used to access data in the WebAssembly Memory.  This will happen when you need to dereference a pointer, access strings, or access structures. See documented here XXXXXXXXXXX.

`memWasm` is exposed by both `IWasmModule` and `IWasmModuleAsync`.  

- `IWasmModule` exposes `wasmMem: IWasmMemory` 
- `IWasmModuleAsync` exposes `wasmMem: IWasmMemoryAsync`.  

These are very similar.  THe difference is that the `PutXXX` functions use the `async` keyword in `IWasmMemoryAsync`.  This will only happen if the `twrLibrary` is being used by `twrWasmModuleAsync`.  The reason is that `PutXX` makes a call to `malloc`, and in `twrWasmModuleAsync`, `malloc` needs to message the Worker thread and `await` for a response.

If you wish to write a function that accesses the `async` `PutXXX` functions, you should use the `isAsyncFunction: true` option.  See below.

## `twrWasmModule` and `twrWasmModuleAsync`.
twrLibrary's are designed to work with either `twrWasmModule` and `twrWasmModuleAsync`.  (Recall that twr-wasm has two different module types:  `twrWasmModule` and `twrWasmModuleAsync`).

- `twrWasmModule` runs in the JavaScript main thread, and thus all functions that it exposes are asynchronous -- meaning that they should return relatively quickly and not block execution.
- `twrWasmModuleAsync` runs in a JavaScript Worker thread , and thus all functions that it exposes are synchronous  -- meaning they can block C execution.  The "Async" in `twrWasmModuleAsync` refers to the fact that javaScript can `await` on `twrWasmModuleAsync` blocking APIs.  It takes blocking APIs and makes them "asynchronous" to the JavaScript main thread.

In the above example, `twr_timer_single_shot` will work correctly with both `twrWasmModule` and `twrWasmModuleAsync`.  It is an asynchronous function -- meaning that it returns quickly.  

After `milliSeconds` has passed, an event is posted to the C code.

## `twrWasmModuleAsync` thread structure
### The `twr_sleep` function is used to illustrate thread structure
The function `twr_sleep_async` will only function with `twrWasmModuleAsync` because it causes the C code to block.  For example, `twr_sleep` can be used like this:

~~~c
printf("going to sleep...");
twr_sleep(1000);
printf("awake!\n");
~~~
### Two Threads
The`twrWasmModuleAsync` consists of two threads:  The JavaScript main thread, and the WebWorker.  In general, the code for your library functions is always executed in the JavaScript main thread.   In the WebWorker, an internal class called `twrWasmModuleAsyncProxy` executes.  The default execution (unless `isCommonCode` is specified -- which is explained later), happens like this:

1. in C: twr_sleep() is called
2. in `twrWasmModuleAsyncProxy`, a message is sent to the JavaScript main thread, requesting execution of the `twrLibTimer.twr_sleep` function.
3. `twrWasmModuleAsyncProxy` is paused (thus `twr_sleep` is blocking), waiting for a response to the message sent ins step 2.
3. The JavaScript main thread receives the message, and `awaits` on `twrLibTimer.twr_sleep`
4. When the Promise that is being awaited on resolves, the JavaScript main threads sends a reply back to `twrWasmModuleAsyncProxy` indicating that execution is complete. If there are any return codes they are also sent (twr_sleep does not have a return code)
5. `twr_sleep` returns to the C caller

## `import` options
The various `import` options are used to handle different cases for `twrWasmModuleAsync`.

The import options are:
~~~
isAsyncFunction?:boolean;
isModuleAsyncOnly?:boolean;
isCommonCode?:boolean;
~~~

### `isAsyncFunction`
This option is used when you wish to `await` inside the implementation of your function. This option also specifies that the function will be called with `await`.

If this option is not specified, the same function will be used for both module types, and the function can not use the `await` keyword. 

Here is an example of how declare a function with the `import` option `isAsyncFunction`:

~~~
async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number)
~~~

Note that:

- the function declaration starts with the async keyword
- the function has the suffix `_async` appended to its `import` name
- that the function is passed an `IWasmModuleAsync`.

By using this option, you may need to create two versions of the `import` function -- one that is `async` (for use by `twrWasmModuleAsync`), and one that does not use the `async` keyword--for use by `twrWasmModule`.

In a case like `twr_sleep`, there is only one function implemented for sleep - the async function.  But this is not always the case.  For example, if your `import` function uses the `wasmMem.PutXX` functions, you will need to create two functions for the `import`.  Here is an example:

~~~js
 imports:TLibImports = {
      ex_append_two_strings:{isAsyncFunction: true},
   };

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
~~~

### `isModuleAsyncOnly`
This option specifies that the indicated function is only available to `twrWasmModuleAsync`. This option should be used for functions that block C execution. The `twr_sleep` is an example.

### `isCommonCode`
This option is used to specify a function that should be used directly by the `twrWasmModuleAsync` WebWorker.  Without this option, the behavior is that code running in the WebWorker will send a message to the JavaScript Main thread requesting that the function be executed in the context of the JavaScript main thread.  The WebWorker will then wait for a reply to the message before continuing C execution.  However, in certain cases, it is possible, and might be more performant, to have the code execute directly in the WorkerThread.

Here is an Example:

~~~js
export default class twrLibMath extends twrLibrary {
   imports:TLibImports = {
      twrSin:{isCommonCode: true},
   }
   
   // libSourcePath must be set to use isCommonCode
   libSourcePath="./twrlibmath.js";  

   twrSin(callingMod:IWasmModule|twrWasmBase, angle:number ) {return Math.sin(angle)}
}
~~~

In this case the `Math.sin` function is available in both a WebWorker and the JavaScript main thread.  It is a simple function, and there is no need to send a message from the WebWorker to the JavaScript main thread, requesting that `Math.sin` run in the JavaScript main thread.

## The `twrWasmModuleAsync` Event Loop
TODO

