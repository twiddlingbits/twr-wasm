---
title: Basic Steps To Create a Wasm Project
description: The basic steps to integrate your TypeScript/JavaScript with C/C++ WebAssembly code are described
---

# Basic Steps To Create Your Wasm Project
This section describes the basic steps to integrate your TypeScript/JavaScript with C/C++ WebAssembly code.

## Overview of WebAssembly Project

Your C/C++ WebAssembly project consists of HTML (and related JavaScript or TypeScript) and C/C++ source.  The C/C++ is compiled using `clang` into a `.wasm` binary module.  The `.wasm` module is loaded as a WebAssembly module by your JavaScript using `twr-wasm`.

## JavaScript/TypeScript Part of Wasm Project
On the JavaScript side of your WebAssembly project you will use the twr-wasm JavaScript/TypeScript class `twrWasmModule` or `twrWasmModuleAsync` to load the `.wasm` module, and then call C functions in it using `callC` (more details are in the [TypeScript/Javascript API section](../api/api-ts-modules.md)).

## C/C++ Part of Wasm Project
You will call C functions (or C++ with ' extern "C" ' linkage) in the `.wasm` module from your JavaScript.  You can also call JavaScript functions from your C/C++ code, but this is less common.

There is no direct equivalent to a C "main".  Instead, a Wasm module provides exported C functions that you can call from JavaScript/TypeScript.  A Wasm module is more like a runtime loaded dynamic library.

`twr-wasm` supports C/C++ code that is either asynchronous (non-blocking) or syncronous (blocking).  A CLI app is an example of typical blocking code.  A CLI app typically blocks waiting for keyboard input (blocking means that it "takes a long time" to return).  If your C code is a big loop that never returns, that would be very blocking.  Alternately,if you send mouse events to C code, have the code process them then return, this would be non-blocking.    You can use the twr-wasm class `twrWasmModuleAsync` to execute blocking code from JavaScript or `twrWasmModule` to integrate asynchronous C/C++ code. The example [maze](../examples/examples-maze.md) demonstrates both non-blocking and blocking C calls.

See the [examples](../examples/examples-overview.md) of different types of C/C++ apps.

## Steps to integrate C code with JavaScript code

Here are the general steps to integrate your C with your JavaScript:

1. [Compile your C code](compiler-opts.md) with `clang` and link with `wasm-ld` to create the `.wasm` file.
2. On the JavaScript side you:
    1. Access `twr-wasm` "ES" modules in the normal way with `import`. 
    2. Add a `<div id=twr_iodiv>` or `<canvas id=twr_iocanvas>` to your HTML ([see stdio](stdio.md))
    3. Use `new twrWasmModule`, followed by a call to `loadWasm`, then one or more `callC`.
    4. Alternately, use `twrWasmModuleAsync` -- which is interchangeable with `twrWasmModule`, but proxies through a worker thread, which allows you to call blocking functions from the asynchronous JavaScript main thread.
    5. For more details, see the remainder of this documentation, or see the [hello world](../examples/examples-helloworld.md) or [other exampes](../examples/examples-overview.md).

