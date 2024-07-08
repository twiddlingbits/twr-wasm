---
title: Basic Steps To Create a Wasm Project
description: The basic steps to integrate your TypeScript/JavaScript with C/C++ WebAssembly code are described
---

# Basic Steps To Create Your Wasm Project
This section describes the basic steps to integrate your TypeScript/JavaScript with C/C++ WebAssembly code.

## Overview of WebAssembly Project

Your C/C++ WebAssembly project will consist of HTML (and related JavaScript or Typescript) and C or C++ source files that are compiled into a "`.wasm`" binary file that is loaded as a WebAssembly module by your JavaScript.

## JavaScript/TypeScript Part of Wasm Project
On the JavaScript side of your WebAssembly project you will use the twr-wasm JavaScript/TypeScript class `twrWasmModule` or `twrWasmModuleAsync` to load the `.wasm` module, and then call C functions in it using `callC` (more details are in the [TypeScript/Javascript API section](../api/api-typescript.md)).

## C/C++ Part of Wasm Project
You will call C functions (or C++ with ' extern "C" ' linkage) in the `.wasm` module from your JavaScript.  You can also call JavaScript functions from your C/C++ code, but this is less common.

There is no direct equivalent to a C "main".  Instead, a Wasm module provides exported C functions that you can call from JavaScript/TypeScript.  A Wasm module is more like a runtime loaded dynamic library.

You're C/C++ code can be non-blocking or blocking.  Blocking means that it "takes a long time" to return.   For example, if you want to send mouse events to C code, have the code process them then return, this would be non-blocking.  Alternately, if your C code is a big loop that never returns, that would be very blocking.   You can use the twr-wasm class `twrWasmModuleAsync` to execute blocking code from JavaScript.  The example [maze](../examples/examples-maze.md) demonstrates both non-blocking and blocking C calls.

Here are some examples of different types of C/C++ code:

- If you're C/C++ code does not have any direct user interface built in, it can do its calculations and return.  The [FFT](../examples/examples-fft.md) is an example of this.  
- If your C/C++ code uses a classic C "UI", where it gets keys from stdin and sends the results to stdout, you can direct stdin and stdout to a `<div>` or `<canvas>` tag.  This is explained in the [stdio](../gettingstarted/stdio.md) section.
- Your C/C++ code could be sent events from JavaScript (such mouse, key, timer, or other). This is done by simply calling a C function with the events as parameters.  The C/C++ code could then generate no output, could render to a `<div>` or `<canvas>` using stdio type C/C++ functions, or it could render to a `<canvas>` using 2D drawing APIs that correspond to JavaScript canvas 2D draw operations.  ([Balls](../examples/examples-balls.md)) is an example.

## Steps to integrate C code with JavaScript code

Here are the general steps to integrate your C with your JavaScript:

1. [Compile your C code](compiler-opts.md) with clang and link with wasm-ld to create the ``.wasm`` file.
2. On the JavaScript side you:
    1. Access twr-wasm "ES" modules in the normal way with `import`. 
    2. Add a `<div id=twr_iodiv>` or `<canvas id=twr_iocanvas>` to your HTML ([see stdio](stdio.md))
    3. Use `new twrWasmModule()`, followed by a call to `loadWasm()`, then one or more `callC()`.
    4. Alternately, use `twrWasmModuleAsync()` -- which is interchangeable with twrWasmModule, but proxies through a worker thread, and adds blocking support, including blocking char input.
    5. For more details, see the remainder of this documentation, or see the [hello world](../examples/examples-helloworld.md) or [other exampes](../examples/examples-overview.md).

