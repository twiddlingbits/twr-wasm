
<h1>Key Concepts</h1>
This section describes some key concepts that apply when using twr-wasm with your C/C++ Web Assembly code.

<h2>Overview</h2>

Your C/C++ Web Assembly project will consist of HTML (and related JavaScript or Typescript) and C or C++ source files that are compiled into a ".wasm" binary file that is loaded as a Web Assembly module by your JavaScript or HTML.

You will call C functions (or C++ with ' extern "C" ' linkage) in the .wasm module from your JavaScript.  You can also call JavaScript functions from your C/C++ code, but this is less common.

There is no direct equivalent to a C "main".  Instead, a wasm module provides exported C functions that you can call from JavaScript/TypeScript.  A wasm module is more like a runtime loaded dynamic library.

On the JavaScript side you will use the twr-wasm JavaScript/TypeScript class `twrWasmModule` or `twrWasmModuleAsync` to load the .wasm module, and then call C functions in it (more details are in the [TypeScript/Javascript API section](../api/api-typescript.md)).

You're C/C++ code can be non-blocking or blocking.  Blocking means that it "takes a long time" to return.   For example, if you want to send mouse events to C code, have the code process them then return, this would be non-blocking.  Alternately, if your C code is a big loop that never returns, that would be very blocking.   You can use the twr-wasm class `twrWasmModuleAsync` to execute blocking code from JavaScript.  The example [maze](../examples/examples-maze.md) demonstrates both non-blocking and blocking C calls.

Here are some examples of different types of C/C++ code:

- If you're C/C++ code does not have any direct user interface built in, it can do its calculations and return.  The [FFT](../examples/examples-fft.md) is an example of this.  
- If your C/C++ code uses a classic C "UI", where it gets keys from stdin and sends the results to stdout, you can direct stdin and stdout to a `<div>` or `<canvas>` tag.  This is explained in the [stdio](../gettingstarted/stdio.md) section.
- Your C/C++ code could be sent events from JavaScript (such mouse, key, timer, or other). This is done by simply calling a C function with the events as parameters.  The C/C++ code could then generate no output, could render to a `<div>` or `<canvas>` using stdio type C/C++ functions, or it could render to a `<canvas>` using 2D drawing APIs that correspond to JavaScript canvas 2D draw operations.  ([Balls](../examples/examples-balls.md)) is an example.

<h2>Steps to integrate C code with JavaScript code</h2>

Here are the general steps to integrate your C with your JavaScript:

1. [Compile your C code](compiler-opts.md) with clang and link with wasm-ld to create the `.wasm` file.
2. On the JavaScript side you:
    1. Access twr-wasm "ES" modules in the normal way with `import`. 
    2. Add a `<div id=twr_iodiv>` or `<canvas id=twr_iocanvas>` to your HTML ([see stdio](stdio.md))
    3. Use `new twrWasmModule()`, followed by a call to `loadWasm()`, then one or more `callC()`.
    4. Alternately, use `twrWasmModuleAsync()` -- which is interchangeable with twrWasmModule, but proxies through a worker thread, and adds blocking support, including blocking char input.

<h2>Passing strings, arrayBuffers, etc</h2>
The Web Assembly runtime provided in a browser will only pass numbers between C functions and JavaScript functions.  This means if you use `twrWasmModule.callC` to call a C function, and pass integers or floats as arguments, they will work as expected.  But if you pass a string,  arrayBuffer, or the contents or a URL, `twrWasmModule.callC` will:

-  allocate memory in your WebAssembly.Memory (using malloc).
-  copy the string (or  arrayBuffer or URL contents) into this memory.
-  pass the memory index (aka a pointer in C land) to your C code. 
-  If URL contents are passed, your C function will receive a pointer to the data as the first argument, and a length as the second argument.
-  If an arrayBuffer is passed to your C/C++ code, you probably will also need to pass in the length (unless it is already known).
-  Upon return, the malloced memory is freed, and if the argument was an arrayBuffer, the appropriate contents in the wasm module memory are copied back into the arrayBuffer.   This means that if your C code modifies a passed in block of arrayBuffer memory, the results will be reflected back into javaScript land. 

Some module functions (such as `getString`) take or return an "index:number".  Here index means an index into WebAssembly.Memory.  As far as your C code is concerned, this is a pointer.

Recalled that an arrayBuffer can be created and accessed using classes like `Uint8Array` or `Float32Array`.

It is helpful to look at the [examples](../examples/examples-overview.md).
