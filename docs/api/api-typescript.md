---
title: TypeScript-JavaScript API to load & call Wasm, Consoles
description: twr-wasm provides TypeScript/JavaScript classes to load Wasm modules, call C, create I/O Consoles. Use Blocking or non-blocking C code.
---

# TypeScript-JavaScript API<br>Load and call Wasm, Create i/o Consoles
This section describes the twr-wasm TypeScript/JavaScript classes that you use to:

- load your Wasm modules, and to call C functions in your Wasm modules.
- create I/O Consoles for character streaming, a terminal, or 2D Canvas Drawing

`class twrWasmModule` and `class twrWasmModuleAsync` are used to load .wasm modules and call their C functions.  Both classes have similar APIs.  The primary difference is that `class twrWasmModuleAsync` proxies functionality through a Web Worker thread, which allows blocking C functions to be called in your WebAssembly Module.   The `Async` part of `twrWasmModuleAsync` refers to the ability to `await` on a blocking `callC` in your JavaScript main thread, when using `twrWasmModuleAsync`.

The classes `twrConsoleDiv`, `twrConsoleTerminal`, `twrConsoleDebug`, and `twrConsoleCanvas` create consoles that enable user i/o. Your C/C++ can direct user interactive i/o to these consoles.  See [Console Introduction](../gettingstarted/stdio.md) for information on enabling character input and output in a module.

## APIs Common to twrWasmModule and twrWasmModuleAsync
### Common Constructor Options
See [module options below](#module-options).

### loadWasm
Use `loadWasm` to load your compiled C/C++ code (the `.wasm` file). 
~~~
await mod.loadWasm("./mycode.wasm")
~~~

### callC
After your .`wasm` module is loaded with `loadWasm`, you call functions in your C/C++ from TypeScript/JavaScript like this:
~~~
let result=await mod.callC(["function_name", param1, param2])
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

`callC` returns the value returned by the C function. `long`, `int32_t`, `int`, `float` or `double` and the like are returned as a `number`,  `int64_t` is returned as a `bigint`, and pointers are returned as a `number`.  The contents of the pointer will need to be extracted using the functions listed below in the section "Accessing Data in the WebAssembly Memory".  The [callC example](../examples/examples-callc.md) also illustrates this. 

More details can be found in this article: [Passing Function Arguments to WebAssembly](../gettingstarted/parameters.md) and [in this example](../examples/examples-callc.md).  The [FFT example](../examples/examples-fft.md) demonstrates passing and modifying a `Float32Array` view of an `ArrayBuffer`.

## class twrWasmModule
This class is used when your C function call will not block (that is, they will not take 'a long time' to execute).

The constructor accepts an optional object (type `IModOpts`), which is explained further down.
~~~
import {twrWasmModule} from "twr-wasm";

const mod = new twrWasmModule();
~~~

## class twrWasmModuleAsync
This class is used to enable blocking C functions, suchs as `sleep` or traditional C style blocking input (such as `getc`);

The constructor accepts an optional object (type `IModOpts`), which is explained further down.

~~~
import {twrWasmModuleAsync} from "twr-wasm";
  
const amod = new twrWasmModuleAsync();
~~~

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

See [Compiler Options](../gettingstarted/compiler-opts.md).

### JavaScript Needed for Char Input
You should add a line like the following to your JavaScript for key input to work:

~~~js
yourDivOrCanvasElement.addEventListener("keydown",(ev)=>{yourConsoleClassInstance.keyDown(ev)});
~~~

You likely want a line like this to automatically set the focus to the div or canvas element (so the user doesn't have to click on the element to manually set focus.  Key events are sent to the element with focus.):

~~~js
yourDivOrCanvasElement.focus();
~~~

You will also need to set the tabindex attribute in your tag like this to enable key events:

~~~html
<div id="twr_iodiv" tabindex="0"></div>
<canvas id="twr_iocanvas" tabindex="0"></canvas>
~~~

[See this example](../examples/examples-stdio-div.md) on character input.

Note that this section describes blocking input.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from JavaScript using `callC`.  See the [`balls`](../examples/examples-balls.md) or [`pong`](../examples/examples-pong.md) examples.

### SharedArrayBuffers
`twrWasmModuleAsync` uses SharedArrayBuffers which require certain HTTP headers to be set. Note that `twrWasmModule` has an advantage in that it does **not** use SharedArrayBuffers.

Github pages doesn't support the needed CORS headers for SharedArrayBuffers.  But other web serving sites do have options to enable the needed CORS headers.  For example, the azure static web site config file `staticwebapp.config.json` looks like this:
~~~json
{
    "globalHeaders": {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
}
~~~

[server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) in the examples folder will launch a local server with the correct headers.  To use Chrome without a web server, see the [Hello World walk through](../gettingstarted/helloworld.md).

Also see [production note](../more/production.md).

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
- all other attribute names are available for your consoles.

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
struct IoConsole * stream1=twr_get_console("stream1");
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
- `TStdioVals` have been removed (they were a not to useful option in prior versions of twr-wasm)
- `divLog` is deprecated.  Instead use the `putStr` member function on most consoles.

## Console Classes

### class twrConsoleDebug 
`twrConsoleDebug` streamings characters to the browser debug console.  

C type: `IO_TYPE_CHARWRITE`

There are no constructor parameters.

### class twrConsoleDiv
`twrConsoleDiv` streams character input and output to a div tag .

C type:  `IO_TYPE_CHARREAD` and  `IO_TYPE_CHARWRITE`

The div tag will expand as you add more text (via printf, etc).

You pass a `<div>` element to use to render the Console to to the `twrConsoleDiv` constructor.  For example:
~~~js
<div id="div1" tabindex="0"></div>

<script type="module">
   import {twrWasmModuleAsync, twrConsoleDiv} from "twr-wasm";

   const stream1Element=document.getElementById("div1");

   // adding keyDown events is needed if the console will accept key input
   // don't forget to set "tabindex" in your tag, otherwise it won't get key events
   stream1Element.addEventListener("keydown",(ev)=>{stream1.keyDown(ev)});

   const stream1 = new twrConsoleDiv(stream1Element);
   const mod = new twrWasmModuleAsync( {stdio: stream1} );
   // mod.callC would go here...
</script>
      
~~~

There are constructor options to set the color and font size. You can also set these directly in the HTML for your `<div>` tag. If you wish to change the default font, set the font in the `div` tag with the normal HTML tag options.

~~~js title="twrConsoleDiv constructor options"
constructor(element:HTMLDivElement,  params:IConsoleDivParams)

export interface IConsoleDivParams {
   foreColor?: string,
   backColor?: string,
   fontSize?: number,
}
~~~

### class twrConsoleTerminal
`twrConsoleTerminal` provides streaming and addressable character input and output.  A `<canvas>` tag is used to render into.

C types: `IO_TYPE_CHARREAD`, `IO_TYPE_CHARWRITE`, `IO_TYPE_ADDRESSABLE_DISPLAY`

twrConsoleTerminal is a simple windowed terminal and supports the same streamed output and input features as a does `twrConsoleDiv`, but also supports x,y coordinates, colors, and other features. The window console supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

The canvas width and height, in pixels, will be set based on your selected font size and the width and height (in characters) of the terminal.  These are passed as constructor options when you instantiate the `twrConsoleTerminal`.

You can use the `putStr` member function on most consoles to print a string to the terminal in JavaScript.

As you add more text (via printf, etc), the `twrConsoleTerminal` will scroll if it becomes full (unlike `twrConsoleDiv`, which expands)

[A list of C functions](../api/api-c-con.md#io-console-functions) that operate on `twrConsoleTerminal` are available.

Here is an example:
~~~js
<body>

   <canvas id="canvas1forterm" tabindex="0"></canvas>

   <script type="module">
      import {twrWasmModuleAsync, twrConsoleTerminal} from "twr-wasm";

      // find the HTML elements that we will use for our console to render into
      const term1Element=document.getElementById("canvas1forterm");

      // adding keyDown events is needed if the console will accept key input
      // don't forget to set "tabindex" in your tag, otherwise it won't get key events
      term1Element.addEventListener("keydown",(ev)=>{term1.keyDown(ev)});

      // create the console
      const term1 = new twrConsoleTerminal(term1Element, {widthInChars: 50, heightInChars: 20});

      const amod = new twrWasmModuleAsync( 
         {io:{
            stdio: debug, stderr: debug, stream1: stream1, stream2: stream2, term1: term1, term2: term2, draw1: draw1, draw2: draw2
         }} );

      // set the input focus so user doesn't have to click
      stream1Element.focus();

      // load the wasm code and call the multi C function
      await amod.loadWasm("./multi-io.wasm");
      await amod.callC(["multi"]);

      // example of using a console in in JavaScript
      stream1.putStr(`Hello stream1 of type ${stream1.getProp("type")} from JavaScript!\n`);

   </script>
</body>
~~~

~~~js title="twrConsoleTerminal constructor options"
constructor (canvasElement:HTMLCanvasElement, params:IConsoleTerminalParams)

// see twrConsoleDiv options elsewhere, which are also supported
export interface IConsoleTerminalParams extends IConsoleDivParams {
   widthInChars?: number,
   heightInChars?: number,
}
~~~

### class twrConsoleCanvas
`twrConsoleCanvas` creates a 2D drawing surface that the Canvas compatible [2d drawing APIs](../api/api-c-d2d.md) can be used with. 

C type: `IO_TYPE_CANVAS2D`.

~~~js
constructor(element:HTMLCanvasElement)
~~~

~~~js title="twrConsoleCanvas Example"
<body>
   canvas id="canvas1for2d"></canvas>

   <script type="module">
      import {twrWasmModule, twrConsoleCanvas} from "twr-wasm";

      // find the HTML elements that we will 
      // use for our console to render into
      const draw1Element=document.getElementById("canvas1for2d");

      // create the console
      const draw1 = new twrConsoleCanvas(draw1Element);

      const mod = new twrWasmModule( {io: {std2d: draw1}  }} );

      // callC here...
   </script>
~~~

## Accessing Data in the WebAssembly Memory
`callC()` will convert your JavaScript arguments into a form suitable for use by your C code.  However, if you return or want to access struct values inside TypeScript you will find the following `twrWasmModule` and `twrWasmModuleAsync` functions handy. See the [callc example](../examples/examples-callc.md) and [Passing Function Arguments from JavaScript to C/C++ with WebAssembly](../gettingstarted/parameters.md) for an explanation of how these functions work.
~~~js
async putString(sin:string, codePage=codePageUTF8)  // returns index into WebAssembly.Memory
async putU8(u8a:Uint8Array)   // returns index into WebAssembly.Memory
async putArrayBuffer(ab:ArrayBuffer)  // returns index into WebAssembly.Memory
async fetchAndPutURL(fnin:URL)  // returns index into WebAssembly.Memory
async malloc(size:number)           // returns index in WebAssembly.Memory.  

stringToU8(sin:string, codePage=codePageUTF8)
copyString(buffer:number, buffer_size:number, sin:string, codePage=codePageUTF8):void
getLong(idx:number): number
setLong(idx:number, value:number)
getDouble(idx:number): number
setDouble(idx:number, value:number)
getShort(idx:number): number
getString(strIndex:number, len?:number, codePage=codePageUTF8): string
getU8Arr(idx:number): Uint8Array
getU32Arr(idx:number): Uint32Array
      
memory?:WebAssembly.Memory;
mem8:Uint8Array;
mem32:Uint32Array;
memD:Float64Array;
~~~

