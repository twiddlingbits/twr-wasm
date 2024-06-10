
<h1>Key Concepts</h1>

<h2>Steps to integrate C code with JavaScript code</h2>

Here are the general steps to integrate your C with your JavaScript:

1. [Compile your C code](compiler-opts.md) with clang and link with wasm-ld to create the `.wasm` file.
2. On the JavaScript side you:
    1. Access tiny-wasm-runtime "ES" modules in the normal way with `import`. 
    2. Add a `<div id=twr_iodiv>` to your HTML ([see stdio](stdio.md))
    3. Use `new twrWasmModule()`, followed by a call to `loadWasm()`, then `callC()`.
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

See the examples "function-calls" and "fft".
