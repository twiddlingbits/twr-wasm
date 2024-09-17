---
title: TypeScript-JavaScript API to load & call Wasm
description: twr-wasm provides TypeScript/JavaScript classes to load Wasm modules and call C. Use Blocking or non-blocking C code.
---

# Wasm Modules
This section describes the twr-wasm TypeScript/JavaScript classes `twrWasmModule` and `twrWasmModuleAsync` that are used to load `.wasm` modules, call their C functions, and access wasm memory.  Both classes have similar APIs.  

## About `twrWasmModule`
`class twrWasmModule` allows you to integrate WebAssembly C/C++ code into your Web Page.  You can call C/C++ functions, and read and write WebAssembly memory. Function calls are asynchronous, as is normal for a JavaScript function.  That is C/C++ functions should not block - they should return quickly (just as happens in JavaScript).

The constructor accepts an optional object (type `IModOpts`), which is explained further down.
~~~js
import {twrWasmModule} from "twr-wasm";

const mod = new twrWasmModule();
~~~

## About `twrWasmModuleAsync`
`class twrWasmModuleAsync` allows you to integrate WebAssembly C/C++ code into your Web Page that uses a CLI pattern or that blocks.  For example, with `twrWasmModuleAsync` your C/C++ code can call a synchronous function for keyboard input (that blocks until the user has entered the keyboard input).  Or your C/C++ code can `sleep` or otherwise block.   This is the pattern that is used by many standard C library functions - `fread`, etc.  

`class twrWasmModuleAsync` creates a WorkerThread that runs in parallel to the JavaScript main thread.  This Worker thread executes your C/C++ code, and proxies functionality that needs to execute in the JavaScript main thread via remote procedure calls.  This allows the JavaScript main thread to `await` on a blocking `callC` in your JavaScript main thread.  

The `Async` part of the `twrWasmModuleAsync` name refers to the property of `twrWasmModuleAsync` that makes your synchronous C/C++ code asynchronous.

The APIs in `class twrWasmModuleAsync` are identical to `class twrWasmModule`, except that certain functions use the `async` keyword and thus need to be called with `await`.  This happens whenever the function needs to cross the JavaScript main thread and the Worker thread boundary.  For example:  `callC` or `malloc`.

The constructor accepts an optional object (type `IModOpts`), which is explained further down.

~~~js
import {twrWasmModuleAsync} from "twr-wasm";
  
const amod = new twrWasmModuleAsync();
~~~


## loadWasm
This function is available on both `class twrWasmModule` and `class twrWasmModuleAsync`.

Use `loadWasm` to load your compiled C/C++ code (the `.wasm` file). 
~~~js
await mod.loadWasm("./mycode.wasm")
~~~

## callC
This function is available on both `class twrWasmModule` and `class twrWasmModuleAsync`.   `twrWasmModuleAsync` returns a Promise, `twrWasmModule` does not.

After your .`wasm` module is loaded with `loadWasm`, you call functions in your C/C++ from TypeScript/JavaScript like this:

~~~js title='twrWasmModule'
let result=mod.callC(["function_name", ...params])
~~~

~~~js title='twrWasmModuleAsync'
let result=await mod.callC(["function_name", ...params])
~~~

If you are calling into C++, you need to use `extern "C"` like this in your C++ function:
~~~
extern "C" int function_name() {}
~~~

Each C/C++ function that you wish to call from TypeScript/JavaScript needs to be exported in your `wasm-ld` command line with an option like this:
~~~
--export=function_name
~~~
Or like this in your source file:
~~~
__attribute__((export_name("function_name")))
void function_name() {
   ...
}
~~~

Fo more details, see the [Compiler Options](../gettingstarted/compiler-opts.md).

`callC` takes an array where:

- the first entry is the name of the C function in the Wasm module to call 
- and the next optional entries are a variable number of arguments to pass to the C function, of type:
  
    - `number` - will be converted to a signed or unsigned `long`, `int32_t`, `int`, `float` or `double` as needed to match the C function declaration.
    - `bigint` - will be converted into an `int64_t` or equivalent
    - `string` - converted to a `char *` of malloc'd module memory where string is copied into
    - `ArrayBuffer` - the array is copied into malloc'd module memory.  If you need to pass the length, pass it as a separate argument.  Any modifications to the memory made by your C code will be reflected back into the JavaScript ArrayBuffer.
    - `URL` - the url contents are copied into malloc'd module Memory, and two C arguments are generated - index (pointer) to the memory, and length

`callC` returns the value returned by the C function. `long`, `int32_t`, `int`, `float` or `double` and the like are returned as a `number`.   `int64_t` is returned as a `bigint`, and pointers are returned as a `number`.  The contents of the pointer will need to be extracted using the [functions listed below](api-ts-memory.md).   More details can be found in this article: [Passing Function Arguments to WebAssembly](../gettingstarted/parameters.md) and [in this example](../examples/examples-callc.md).  The [FFT example](../examples/examples-fft.md) demonstrates passing and modifying a `Float32Array` view of an `ArrayBuffer`.

Although you can always use `await` on a `callC`, it is only strictly necessary if the module is of class `twrWasmModuleAsync`.

`CallC` is mapped to `wasmCall.callC`.  `wasmCall` also exposes `callCImpl`, which can be used if no argument conversion is needed.That is if the [arguments are all numbers).](../gettingstarted/parameters.md#webassembly-virtual-machine-intrinsic-capabilities)

## twrWasmModuleAsync Details
`twrWasmModuleAsync` implements all of the same functions as `twrWasmModule`, plus allows blocking inputs, and blocking code generally. This is achieved by proxying all the calls through a Web Worker thread. 

For example, with this C function in your Wasm module:
~~~
void mysleep() {
   twr_sleep(5000);  // sleep 5 seconds
}
~~~

can be called from your JavaScript main loop like this:
~~~
await amod.callC(["mysleep"]);
~~~

You must use `twrWasmModuleAsync` in order to:

- call any blocking C function (meaning it takes "a long time") to return
- use blocking input from a div or canvas ( eg. [`twr_mbgets`](../api/api-c-general.md#twr_mbgets) )
- use `twr_sleep`

### Linking Requirements
When linking your C/C++ code, `twrWasmModule` and `twrWasmModuleAsync` use slightly different `wasm-ld` options since `twrWasmModuleAsync` uses shared memory. `twrWasmModule` will operate with shared memory, so technically you could just use the same share memory options with either module,  but you don't need the overhead of shared memory when using twrWasmModule, and so better to not enable it.

See [wasm-ld Linker Options](../gettingstarted/compiler-opts.md#wasm-ld-linker-options).

### JavaScript Needed for Char Input
When a console will handle key input, you need to add a line to your JavaScript to send key events to the console.  There are two options for this:  You can send the key events directly to the console, or if the key events are always directed to `stdio`, you cam send the key events to the module.  This latter case is primarily for when you are using [tag shortcuts](../gettingstarted/stdio.md#tag-shortcuts).

To send key events to the console, you add a line like this:
~~~js
yourDivOrCanvasElement.addEventListener("keydown",(ev)=>{yourConsoleClassInstance.keyDown(ev)});
~~~

To send key events to the module's `stdio`, you add a line like this:
~~~js
yourDivOrCanvasElement.addEventListener("keydown",(ev)=>{yourModuleClassInstance.keyDown(ev)});
~~~

You likely want a line like this to automatically set the focus to the div or canvas element (so the user doesn't have to click on the element to manually set focus.  Key events are sent to the element with focus.):

~~~js
yourDivOrCanvasElement.focus();
~~~

You will also need to set the `tabindex` attribute in your tag like this to enable key events:

~~~html
<div id="twr_iodiv" tabindex="0"></div>
<canvas id="twr_iocanvas" tabindex="0"></canvas>
~~~

[See this example](../examples/examples-divcon.md) on character input.

Note that this section describes blocking input.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from JavaScript using `callC`.  See the [`balls`](../examples/examples-balls.md) or [`pong`](../examples/examples-pong.md) examples.

### SharedArrayBuffers
`twrWasmModuleAsync` uses SharedArrayBuffers which require certain CORS HTTP headers to be set. Note that `twrWasmModule` does **not** use SharedArrayBuffers.  If you limit yourself to `twrWasmModule` you will not need to worry about configuring the CORS http headers on your web server.

[See this note on enabling CORS HTTP headers for SharedArrayBuffers](../more/production.md).

## Module Options
The `twrWasmModule` and `twrWasmModuleAsync` constructor both take optional options.

For example:
~~~js
let amod=new twrWasmModuleAsync();

let amod=new twrWasmModuleAsync({
   stdio: new twrConsoleDebug();  // send stdio to debug console
   });
~~~

These are the options:
~~~js title="twrWasmModule & twrWasmModuleAsync Options"
export interface IModOpts {
   stdio?: IConsoleStream&IConsoleBase,
   d2dcanvas?: IConsoleCanvas&IConsoleBase,
   io?: {[key:string]: IConsole},
}
~~~

### `stdio` Option
Set this to a Console class instance.  If you leave it undefined, `twrConsoleDebug` will be used (or a [tag shortcut](../gettingstarted/stdio.md#tag-shortcuts), if set)

This option is a shortcut to setting `stdio` using the `io` option.

###  `d2dcanvas` Option
Set this to a `twrConsoleCanvas` instance to configure a [2D drawing](../api/api-c-d2d.md) surface. If you leave it undefined, a [tag shortcut](../gettingstarted/stdio.md#tag-shortcuts) will be used.

This option is a shortcut to setting `std2d` using the `io` option (note the different names).

### `io` Option: Multiple Consoles with Names
This option allows you to assign names to consoles.  The C/C++ code can then retrieve a console by name.

When using the `io` object to specify named consoles:

- You can use the attribute  `stdio` to set stdio.  
- You can use the attribute `stderr` to set stderr
- You can use the attribute `std2d` to set the default 2D Drawing Surfaces -- used by [twr-wasm 2D APIs.](../api/api-c-d2d.md)
- all other attribute names are available for your consoles.  Use this to access consoles in C/C++ beyond (or instead of) stdio, etc.

Alternately, you can specify `stdio` and `std2d` directly as module attributes (outside of `io`) as a shortcut (see above).

There is a [twr-wasm C API](../api/api-c-con.md#twr_get_console) to access named consoles: `twr_get_console`.

This code snippet shows how to use the `io` option to pass in an object containing named console attributes:

~~~js
const stream1Element=document.getElementById("stream1");
const stream2Element=document.getElementById("stream2");

const debug = new twrConsoleDebug();
const stream1 = new twrConsoleDiv(stream1Element);
const stream2 = new twrConsoleDiv(stream2Element);

stream1Element.addEventListener("keydown",(ev)=>{stream1.keyDown(ev)});
stream2Element.addEventListener("keydown",(ev)=>{stream2.keyDown(ev)});

// setting stdio and/or stderr to a debug console isn't necessary since that will be the default if stdio or stderr is not set.
// but here to show how to set stdio and/or stderr.  They can be set to any console.
const amod = new twrWasmModuleAsync( {io:{stdio: debug, stderr: debug, stream1: stream1, stream2: stream2}} );
const mod = new twrWasmModule( {io:{stdio: debug, stderr: debug, stream1: stream1, stream2: stream2}} );
~~~

In this case, as well as setting stdio and stderr, consoles named "stream1" and "stream2" are made available to the C/C++ code.

~~~c title="Using a Named Console"
twr_ioconsole_t * stream1=twr_get_console("stream1");
fprintf(stream1, "Hello Stream One!\n");
~~~

A [complete example multi-io](../examples/examples-multi-io.md) is provided.

### Deprecated Options
The following options are deprecated.  Instead of these, use options available to `twrConsoleDiv` and `twrConsoleTerminal` constructors.

~~~js title="deprecated"
export interface IModOpts {
   windim?:[number, number],
   forecolor?:string,
   backcolor?:string,
   fontsize?:number,
}
~~~

Note:

- `windim` - if stdio is set to a `twrConsoleTerminal`, this will set the width and height, in characters.  Instead, use constructor options on twrConsoleTerminal.
- `forecolor` and `backcolor` - if stdio is set to `twrConsoleDiv` or `twrConsoleTerminal`, these can be set to a CSS color (like '#FFFFFF' or 'white') to change the default background and foreground colors.  However, these are deprecated, and instead, use the `twrConsoleDiv` or `twrConsoleTerminal` constructor options.
- `fonsize` - Changes the default fontsize if stdio is set to `twrConsoleDiv` or `twrConsoleTerminal`.  Deprecated, instead use `twrConsoleDiv` or `twrConsoleTerminal` constructor options.
- `TStdioVals` have been removed (they were a not too useful option in prior versions of twr-wasm)
- `divLog` is deprecated.  Instead use the `putStr` member function on most consoles.

