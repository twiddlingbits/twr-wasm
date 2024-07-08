---
title: Wasm Runtime Limitations
description: An explanation of why a library like twr-wasm or emscripten is needed to build C/C++ WebAssembly modules.
---

# Wasm Runtime Limitations
HTML browsers can load a WebAssembly module, and execute it's bytecode in a browser virtual machine.  You compile your code using clang with the target code format being WebAssembly (wasm) byte code.   There are a few issues that one immediately encounters trying to execute code that is more complicated than squaring a number.  

The first is that there is no C/C++ runtime support native to a WebAssembly module.  That is, no malloc or printf or similar functions.  Even beyond than that, there are missing compiler support functions.  That is, clang code generation will produce calls for compiler support routines needed for floating point, memcpy, and the like.   This code is usually handled behind the scenes for you.  For example, gcc will link to "libgcc" automatically.  clang uses "compile-rt".  This doesn't happen with WebAssembly compiles (unless you use emscripten or twr-wasm).

The second problem is that all the function calls between your Wasm module and your javascript are limited to parameters and return values that are numbers (integer and float). No strings, arrays, struct pointers, etc.

The third problem is that legacy C code or games often block, and when written this way they don't naturally integrate with the JavaScript asynchronous programming model.

twr-wasm is a static C library (twr.a) that you can link to your clang C/C++ code, as well as a set of JavaScript/TypeScript modules that solve these issues.
