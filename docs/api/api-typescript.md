
# TypeScript-JavaScript API
## class twrWasmModule
~~~
import {twrWasmModule} from "tiny-wasm-runtime";
  
const mod = new twrWasmModule();
~~~
`twrWasmModule` provides the two core Javascript APIs for access to a Web Assembly Module: 

- `loadWasm` to load your `.wasm` module (your compiled C code).
- `callC` to call a C function

These functions are documented further down in this section.

## class twrWasmModuleAsync
~~~
import {twrWasmModuleAsync} from "tiny-wasm-runtime";
  
const amod = new twrWasmModuleAsync();
~~~

`twrWasmModuleAsync` implements all of the same functions as `twrWasmModule`, plus allows blocking inputs, and blocking code generally. This is achieved by proxying all the calls through a Web Worker thread. 

Use `twrWasmModuleAsync` if your C code blocks, or if you are unsure.  If you want better performance and don't need the capabilities of `twrWasmModuleAsync`, use `twrWasmModule`.

You must use `twrWasmModuleAsync` in order to:

- call any blocking C function (meaning it takes "a long time") to return
- use blocking input from a div or canvas ( eg. `twr_mbgets` )
- use `twr_sleep`

See [stdio section](../gettingstarted/stdio.md) for information on enabling blocking character input, as well as this [Example](../examples/examples-stdio-div.md).

When comping/linking your C/C++ code, `twrWasmModule` and `twrWasmModuleAsync` use slightly different `wasm-ld` options since `twrWasmModuleAsync` uses shared memory. `wrWasmModule` will operate with shared memory, so technically you could just use the same share memory options with either module,  but you don't need the overhead of shared memory when using twrWasmModule, and so better to not enable it.

See [Compiler Options](../gettingstarted/compiler-opts.md).

`twrWasmModuleAsync` uses SharedArrayBuffers which require certain HTTP headers to be set. Note that `twrWasmModule` has an advantage in that it does **not** use SharedArrayBuffers.

Github pages doesn't support the needed CORS headers for SharedArrayBuffers.  But other web serving sites do have options to enable the needed CORS headers.  For example, the azure static web site config file `staticwebapp.config.json` looks like this:
~~~
{
    "globalHeaders": {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
}
~~~

[server.py](https://github.com/twiddlingbits/tiny-wasm-runtime/blob/main/examples/server.py) in the examples folder will launch a local server with the correct headers.  To use Chrome without a web server, see the [debugging section](../more/debugging.md).

## Class Options
The `twrWasmModule` and `twrWasmModuleAsync` constructor both take optional options.

For example:
~~~
let amod=new twrWasmModuleAsync();

let amod=new twrWasmModuleAsync({
   windim:[50,20], 
   forecolor:"beige", 
   backcolor:"DarkOliveGreen", 
   fontsize:18
   });
~~~

For a `<div id="twr_iodiv">` it is simpler to set the color and font in the div tag per the normal HTML method.  But for `<div id="twr_iocanvas">`, that method won't work and you need to use the constructor options for color and fontsize.

These are the options:
~~~
export type TStdioVals="div"|"canvas"|"null"|"debug";

export interface IModOpts {
	stdio?:TStdioVals, 
	windim?:[number, number],
	forecolor?:string,
	backcolor?:string,
	fontsize?:number,
	imports?:{},
}
~~~

### stdio
You can explicitly set your stdio source (for C/C++ printf, etc) with the stdio option, but typically you don't set it.  Instead, it will auto set as [described here](../gettingstarted/stdio.md)

### windim
This options is used with a terminal console ( `<canvas id="twr_iocanvas">` ) to set the width and height, in characters.

The canvas width and height, in pixels, will be set based on your fontsize and the width and height (in characters) of the terminal.

### forecolor and backcolor
These can be set to a CSS color (like '#FFFFFF' or 'white') to change the default background and foreground colors.

### fonsize
Changes the default fontsize for div or canvas based I/O. The size is in pixels.

## loadWasm
Use `loadWasm` to load your compiled C/C++ code (the `.wasm` file). 
~~~
await mod.loadWasm("./mycode.wasm")
~~~

## callC
After your .`wasm` module is loaded with `loadWasm`, you call functions in your C/C++ from TypeScript/JavaScript like this:
~~~
let result=await amod.callC(["bounce_balls_move", param1])
~~~

If you are calling into C++, you need to use extern "C" like this in your C++ code:
~~~
extern "C" int bounce_balls_move() {}
~~~

Each C/C++ function that you wish to call from TypeScript/JavaScript needs to be exported in your wasm-ld settings like this:
~~~
--export=bounce_balls_move
~~~
Or like this in your source file:
~~~
__attribute__((export_name("bounce_balls_move")))
void bounce_balls_move() {
   ...
~~~

See the [Compiler Options](../gettingstarted/compiler-opts.md).

`callC` takes an array where:

- the first entry is the name of the C function in the wasm module to call 
- and the next entries are a variable number of parameters to pass to the C function, of type:
  
    - `number` - will be converted to int32 or float64 as appropriate
    - `string` - converted to a pointer to module Memory where string is copied into
    - `ArrayBuffer` - the array is loaded into module memory.  If you need to pass the length, pass it as a separate parameter.  Any modifications to the memory made by your C code will be reflected back into the JavaScript ArrayBuffer.
    - `URL` - the url contents are loaded into module Memory, and two C parameters are generated - index (pointer) to the memory, and length

`callC` returns the value returned by the C function that was called.  As well `int` and `float`, `string` and structs (or blocks of memory) can be returned. More details can be found in `examples/function-calls`.

The FFT example demonstrates passing a Float32Array view of an ArrayBuffer.

Also see [Key Concepts](../gettingstarted/keyconcepts.md).

## divLog
If [`stdio`](../gettingstarted/stdio.md) is set to `twr_iodiv`, you can use the `divLog` twrWasmModule/Async function like this:
~~~
import {twrWasmModule} from "tiny-wasm-runtime";

const mod = new twrWasmModule();
await mod.loadWasm("./tests.wasm");
await mod.callC(["tests"]);

mod.divLog("\nsin() speed test");
let sumA=0;
const start=Date.now();

for (let i=0; i<2000000;i++)
	sumA=sumA+Math.sin(i);

const endA=Date.now();

let sumB=await mod.callC(["sin_test"]);
const endB=Date.now();

mod.divLog("sum A: ", sumA, " in ms: ", endA-start);
mod.divLog("sum B: ", sumB,  " in ms: ", endB-endA);
~~~
## Accessing Data in the Web Assembly Memory
You probably will not need to use the twrWasmModule/Async functions in this section, as `callC()` will convert your parameters for you.  But if you return or want to pass in more complicated structs, you might need to.   The source in source/twr-wasm-ts/canvas.ts is an example of how these are used.
~~~
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

