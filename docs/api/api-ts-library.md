---
title: Use twrLibrary to Implement Wasm C/C++ API in TypeScript
description: twr-wasm allows you to implement new C/C++ APIs in JavaScript/TypeScript by extending the twrLibrary class.
---

# twr-wasm Libraries
twr-wasm Libraries are used to expose TypeScript code to C/C++ as C APIs.  All of the twr-wasm C APIs are implemented with twr-wasm libraries.  You can also use a library to implement your own C APIs using TypeScript.

There are two kinds of Libraries:
- Those that have only once instance (such as the math library)
- Those that can have multiple instances across one more more library types such as Consoles (see [interfaceName](#interfacename))

## Basic Steps
twr-wasm Libraries support both `twrWasmModule` and `twrWasmModuleAsync`.  That is, when you create a twrLibrary, it will function with either type of module.  In many cases no extra work is needed for the `twrWasmModuleAsync`, but in some cases, extra code is needed.

The class `twrLibrary`  provides the core functionality:

   - Support for functions to be imported into the WebAssembly Module
   - Support for `twrWasmModuleAsync` proxy Web Worker thread
   - An event framework, allowing you to post events to WebAssembly C code.

To implement a twr-wasm library you:

- create a new TypeScript class that extends `class twrLibrary`.  
- create a C .h file for your new functions (with function signatures)
- add one or more functions to your TypeScript class
- add the functions to the `import` object (that is part of your class)
- consider if special handling is needed for `twrWasmModuleAsync` (more on this below)

## Lib Example
See the `lib` [example here](../examples/examples-lib.md) for a more complete example which shows how each of the different use cases can be handled.

## Example twrLibTimer
The following code is from the twr-wasm source for twrlibtimer.

- `twr_timer_single_shot` - sends an event to C after the timer times out.
- `twr_sleep` - blocks C execution for a period of time.

~~~js
import {IWasmModule,} from "./twrmod.js"
import {IWasmModuleAsync} from "./twrmodasync.js"
import {twrLibrary, TLibImports, twrLibraryInstanceRegistry} from "./twrlibrary.js"

// Libraries use default export
export default class twrLibTimer extends twrLibrary {
   id: number;
   imports:TLibImports = {
      twr_timer_single_shot:{},
      twr_sleep:{isAsyncFunction: true, isModuleAsyncOnly: true},
   };

   libSourcePath = new URL(import.meta.url).pathname;

   constructor() {
      // all library constructors should start with these two lines
      super();
      this.id=twrLibraryInstanceRegistry.register(this);
   }

   twr_timer_single_shot(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
      setTimeout(()=>{
         callingMod.postEvent(eventID)
      }, milliSeconds);     
   }

   async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number) {
      const p = new Promise<void>( (resolve)=>{
         setTimeout(()=>{ resolve() }, milliSeconds);  
      });

      return p;
   }

}
~~~

## C Header Files
You need to create a .h file that provides signatures to the C users of your new API.  For example, for this library your .h file would be this:

~~~
__attribute__((import_name("twr_timer_single_shot"))) void twr_timer_single_shot(int ms, int event_id);
__attribute__((import_name("twr_sleep"))) void twr_sleep(int ms);
~~~

The purpose of `import_name` code is to export your functions from WebAssembly to JavaScript.  These are an equivalent alternative to adding the functions to an `wasm-ld` `-export` option.

## Registering your API
To register you class so that the APIs are available to C code, you use code akin to this in your `index.html` (or similar):
~~~
import twrLibTimerMod from "./twrlibtimer.js"  // default export

new twrLibTimerMod();  // will register itself
~~~

If you are a contributor to twr-wasm and plan to add your library as new built-in APIs, add the registration to `twrLibBultins.ts`

## Example Function Explained
Here is what is happening in this code:

~~~
imports:TLibImports = {
   twr_timer_single_shot:{},
}
   
// this function will work in both twrWasmModule and twrWasmModuleAsync
twr_timer_single_shot(callingMod:IWasmModule|IWasmModuleAsync, milliSeconds:number,  eventID:number) {
   setTimeout(()=>{
      callingMod.postEvent(eventID)
   }, milliSeconds);     
}
~~~ 

`twr_timer_single_shot` is listed in the `imports` class member variable which causes the function `twr_timer_single_shot` to be added to the WebAssembly.ModuleImports imports. 

The argument for `callingMod:IWasmModule|IWasmModuleAsync` is filled in by the `twrLibrary` code -- the calling C function does not include this as an argument.   All Parameters following `callingMod` are passed by the C code calling the function.

`twr_timer_single_shot` creates a JavaScript timer.  When the timer completes, an event is posted, which will trigger a callback in the C code.


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
   twr_timer_single_shot(2000, timer);
~~~

In this example, `on_timer` will be called after 2 seconds.

`__attribute__((export_name("on_timer")))` is needed because this C function is exported out of the WebAssembly module and into the JavaScript code.  JavaScript needs to call this function.

In this example, the event does not have any arguments.  But it may -- integers (which includes pointers) can be accepted as arguments to the event callback.  These arguments are event specific.

## imports
All TypeScript functions that you wish to import into a WebAssembly module as C APIs, should be listed in the `imports` object.

Each function in the `imports` object has optional options, that are primarily for use with `twrWasmModuleAsync` modules.

`imports` are added to WebAssembly.ModuleImports imports.

## callingMod
Each function listed in the `import` section will be passed a module as the first parameter.  In general, a function should be written to handle being called either with `IWasmModule` or `IWasmModuleAsync` as the calling module interface ( `callingMod:IWasmModule|IWasmModuleAsync` ).  This is generally straight forward.  

Examples that might cause some extra work, and that are covered below, are:

- Implementing  blocking functions like `twr_sleep`
- Allocating memory, for example, to return a string

## Numbers Only
All of the parameters received by an `import` function need to be numbers.  These functions interface directly with the WebAssembly module with no conversion.  If you are passing or returning strings, or accessing structures, you will need to use the data access functions that are provided in `callingMod.memWasm` (more on this below).  The general issue and approach is [explained in this document.](../gettingstarted/parameters.md).

## memWasm
A `callingMod` member function that you may need to use is `memWasm` (`callingMod.memWasm`).   `memWasm` is used to access data in the WebAssembly Memory.  This will happen when you need to dereference a pointer, access strings, or access structures. [See `wasmMem` documentation here](api-ts-memory.md#accessing-data-in-webassembly-memory).

`memWasm` is exposed by both `IWasmModule` and `IWasmModuleAsync`.  

- `IWasmModule` exposes `wasmMem: IWasmMemory` 
- `IWasmModuleAsync` exposes `wasmMem: IWasmMemoryAsync`.  

If you wish to write a function that accesses the `async` `PutXXX` functions, you should use the `isAsyncFunction: true` option.

## `twrWasmModule` and `twrWasmModuleAsync`.
twrLibrary's are designed to work with either `twrWasmModule` and `twrWasmModuleAsync`.  (Recall that twr-wasm has two different module types:  `twrWasmModule` and `twrWasmModuleAsync`).

- `twrWasmModule` runs in the JavaScript main thread, and thus all functions that it exposes are asynchronous -- meaning that they should return relatively quickly and not block execution.
- `twrWasmModuleAsync` runs in a JavaScript Worker thread , and thus all functions that it exposes are synchronous  -- meaning they can block C execution.  The "Async" in `twrWasmModuleAsync` refers to the fact that javaScript can `await` on `twrWasmModuleAsync` blocking APIs.  It takes blocking APIs and makes them "asynchronous" to the JavaScript main thread.

Although many functions can be listed in `imports` and written without worrying about which type of module is using them, this isn't always true.  Some tomes extra code or thought is needed to have optimal APIs for `twrWasmModuleAsync`.

In the above example, `twr_timer_single_shot` will work correctly with both `twrWasmModule` and `twrWasmModuleAsync`.  It is an asynchronous function -- meaning that it returns quickly.  

However, the function `twr_sleep` blocks C code, and will only work with `twrWasmModuleAsync`.

## `twrWasmModuleAsync` thread structure
To understand more clearly why `twrWasmModuleAsync` might need more attention, it is helpful to understand how it is allocates task between its two threads: the JavaScript main thread, and a worker thread.

### The `twr_sleep` function is used to illustrate thread structure
The function `twr_sleep_async` will only function with `twrWasmModuleAsync` because it causes the C code to block.  For example, `twr_sleep` can be used like this:

~~~c
printf("going to sleep...");
twr_sleep(1000);
printf("awake!\n");
~~~
### `twrWasmModuleAsync` uses Two Threads
The`twrWasmModuleAsync` consists of two threads:  The JavaScript main thread, and the Web Worker.  By default the code for your library functions is always executed in the JavaScript main thread.   In the Web Worker, an internal class called `twrWasmModuleAsyncProxy` executes.  The default execution (unless `isCommonCode` is specified -- which is explained later), happens like this:

1. in C: twr_sleep() is called
2. in `twrWasmModuleAsyncProxy`, a message is sent to the JavaScript main thread, requesting execution of the `twrLibTimer.twr_sleep` function.
3. `twrWasmModuleAsyncProxy` is paused (thus `twr_sleep` is blocking), waiting for a response to the message sent ins step 2.
3. The JavaScript main thread receives the message, and `awaits` on `twrLibTimer.twr_sleep`
4. When the Promise that is being awaited on resolves, the JavaScript main threads sends a reply back to `twrWasmModuleAsyncProxy` indicating that execution is complete. If there are any return codes they are also sent (twr_sleep does not have a return code)
5. `twr_sleep` returns to the C caller


The above sequence actually happens for all `import` functions by default when using `twrWasmModuleAsync`, irregardless if or how long they block for.  This is because certain JavaScript code can only execute in the JavaScript main thread.  Import function options exists to modify this behavior, in the cases where it is not desired.

The above steps also glosses over an important point -- the method that the `twrWasmModuleAsyncProxy` uses to wait for a response from the main JavaScript thread.  In step 3 above (Worker thread is blocking from `twr_sleep` call), the worker thread is blocking on a call to `Atomics.wait`.  Communication from the JavaScript main thread to the Worker is through shared memory and a circular buffer.  This is how twrWasmModuleAsync is able to block execution of the C code.  This means that the Worker Thead main event loop can block for long periods of time -- perhaps indefinitely.  And this means common JavaScript code can not run reliably in the Worker thread.  For example, a setTimeout callback may not happen (because it is dispatched by the main JavaScript event loop).  Likewise, Animations won't work since they are often executed inside the JavaScript event loop.   This is another important reason that all the `import` code generally runs inside the JavaScript main thread.

## Blocking Function Explained

twr-wasm supports blocking functions like sleep when the API user is using `twrWasmModuleAsync`. This section explains the `sleep` function which causes C code to block.  In other words, in C, code like this will work:

~~~c
printf("going to sleep...");
twr_sleep(1000);
printf("awake!\n");
~~~

The TypeScript twrLibrary derived class implementation looks like this:

~~~js
// this function will only work in twrWasmModuleAsync since it blocks the C caller.
async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number) {
   const p = new Promise<void>( (resolve)=>{
      setTimeout(()=>{ resolve() }, milliSeconds);  
   });

   return p;
}
~~~

And has these import options set:
~~~js
imports:TLibImports = {
   twr_sleep:{isAsyncFunction: true, isModuleAsyncOnly: true},
};
~~~

`isAsyncFunction: true` is telling twrLibrary to call the `twr_sleep_async` function with `await` and so allow the function being called to `await`. 
`isModuleAsyncOnly: true` is telling twrLibrary that this function only exists when `twrWasmModuleAsync` is used.

This code will execute in the JavaScript main thread.  The Calling C code (`twr_sleep`) will block in a Worker thread while waiting for this code in the JavaScrit main thread to complete.  The function `twr_sleep_async` creates a JavaScript promise that the calling code will `await` on.  Once the promise  resolves, the calling function will unblock the C `twr_sleep` function that is in the Worker Thread.

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

This option will only modify behavior this way when your function is called from `twrWasmModuleAsync`.

- If this option is not specified, the same `import` function will be used for both module types, and the function can not use the `await` keyword. 
- if this option is specified, then when `twrWasmModuleAsync` calls the indicated `import` function, it will call a version of the function that has `_async` append to the function name.  This means that you will create two versions of the `import` `funcA` - `funcA` and `funcA_async`. 
- If, however, you also specify the option `isModuleAsyncOnly`, then only the `_async` function is expected.

Here is an example of how declare a function with the `import` option `isAsyncFunction`:

~~~
async twr_sleep_async(callingMod:IWasmModuleAsync, milliSeconds:number)
~~~

Note that:

- the function declaration starts with the async keyword
- the function has the suffix `_async` appended to its `import` name
- that the function is passed an `IWasmModuleAsync` as the callingMod.

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
This option is used to specify a function that should be used directly by the `twrWasmModuleAsync` Web Worker.  Without this option, the behavior is that code running in the Web Worker will send a message to the JavaScript Main thread requesting that the function be executed in the context of the JavaScript main thread.  The Web Worker will then wait for a reply to the message before continuing C execution.  However, in certain cases, it is possible, and might be more performant, to have the code execute directly in the WorkerThread.

There are limitations on the code that will work correctly with `isCommonCode`:

- The functions must be available to a Worker thread
- The function can not be `async` (that is, it can not use `await`)
- The functions must not depend on the Worker's main event loop running (this event loop often doesn't execute with the `twrWasmModuleAsync` Worker thread.)
   - The function can not use a callback (the callback won't get called because callbacks are often dispatched in the JavaScript main event loop)

Here is an Example of using `isCommonCode`:

~~~js
export default class twrLibMath extends twrLibrary {
   imports:TLibImports = {
      twrSin:{isCommonCode: true},
   }
   
   libSourcePath = new URL(import.meta.url).pathname;

   twrSin(callingMod:IWasmModule|twrWasmBase, angle:number ) {return Math.sin(angle)}
}
~~~

In this case the `Math.sin` function is available in both a Web Worker and the JavaScript main thread.  It is a simple function, that works fine without the JavaScript event loop operating.

### noBlock
`noBlock` will cause a function call in an `twrWasmModuleAsync` to send the message from the Worker proxy thread to the JS main thread to execute the function, but not to wait for the result.  This should only be used for functions with a `void` return value.  This has the advantage that (a) the C code will not block waiting for a void return value (so it returns faster), and (b) it takes advantage of multiple cores by allowing the JS Main thread and the Worker thread to execute in parallel.  

Note that the messages sent from the proxy thread to the JS main thread (for function execution) will cause execution of function calls to serialize, and so if a function that blocks (waits for results from JS main thread) is called after a call with `noBlock`, everything should work as expected.

Do not use `noBlock` if:
 
  - the function returns a value
  - the C code should not continue executing until the function completes execution.
  - if the following scenario could arise:
      - funcA (with noBlock) called
      - funcB called and returns a value or otherwise depends on funcA completing execution,  and funcA uses async keyword.

Use `noBlock` carefully.

## libSourcePath
   Always set this as follows:
   ~~~js
   libSourcePath = new URL(import.meta.url).pathname;
   ~~~

   `libSourcePath` is used to uniquely identify the library class, as well as to dynamically import the library when `isCommonCode` is used.

## interfaceName
In a twrLibrary, 

 - An "interface" refers to the set of functions that the library exposes to C. Ie, the functions in the `import` object.
 - The name of the interface is anonymous, unless `interfaceName` is set. 
 - An undefined interfaceName (anonymous interface) means that only one instance of that class is allowed (for example `twrLibMath`)
 - Set `interfaceName` to a unique name when multiple instances that support the same interface are allowed (for example the twr-wasm Consoles).  
 - Multiple classes may have the same interfaceName (a class is identified by its libSourcePath). For example `twrConDiv`, `twrConDebug`, `twrConTerminal` all have the same interface.

When multiple instances of classes with the same interface are enabled (by setting `interfaceName`), the first argument in every C function call is expected to be the twrLibrary `id` (a member variable of the twrLibrary derived class).  The twrLibrary will use this `id` to route the function call to the correct instance of the library.  The `id` is not passed to the twrLibrary function (even though it is required to be the first C arg).

The twrLibrary instance should be created in the JavaScript main thread, and passed to the module in the [`io` option.](api-ts-modules.md#io-option-multiple-consoles-with-names)  The C code can discover the `id`, by using the [`twr_get_console`.](api-c-con.md#twr_get_console)

~~~js title='example'
interfaceName = "twrConsole";
~~~

## The `twrWasmModuleAsync` Event Loop
TODO

