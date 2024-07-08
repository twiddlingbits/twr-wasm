---
title: Learn WebAssembly with twr-wasm - Documentation and Examples
description: An easier way to create C/C++ WebAssembly. Unlike emscripten, use clang directly. Examples of blocking functions, 2D drawing, char I/O with <div> tag, etc.
---

# Learn WebAssembly with twr-wasm<br>Documentation and Examples
 
## Easier C/C++ WebAssembly
Version 2.1.1

twr-wasm is a simple, lightweight and easy to use library for building C/C++ WebAssembly code directly with clang. It solves some common use cases with less work than the more feature rich emscripten. 

twr-wasm is easy to understand, and has some great features. You can call blocking functions. You can input and print streaming character i/o to a `<div>` tag, use a `<canvas>` element as an ANSI terminal, and use 2D drawing apis (that are compatible with JavaScript Canvas APIs) to draw to a `<canvas>` element. 

twr-wasm allows you to run C/C++ code in a web browser. Legacy code, libraries, full applications, or single functions can be integrated with JavaScript and TypeScript.

twr-wasm is designed to be used with the standard llvm clang compiler and tools.

twr-wasm was previously named tiny-wasm-runtime.

## Live WebAssembly Examples and Source

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) |
| Maze Gen/Solve (Win32 C Port) | [View live maze](/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/maze) |
| Input/Output with `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-div) |
|Mini-Terminal (hello world using `<canvas>`)|[View demo](/examples/dist/stdio-canvas/index.html) |[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas) |
|CLI using libc++ and `<canvas>`)| [View console](/examples/dist/tests-user/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-user) |

## Key Features
- compile and link C/C++ for use with WebAssembly using clang directly
- standard C library, libc++. and purpose built APIs available from C/C++
- TypeScript/JavaScript classes to load Wasm modules and call C/C++ functions
- localization support, UTF-8, and windows-1252 support
- in C/C++, print and get characters to/from `<div>` tags in your HTML page
- in C/C++, print and get characters to/from a `<canvas>` based "terminal"
- in C/C++ use 2D drawing API compatible with JavaScript Canvas
- in C/C++, use the "blocking loop" pattern and integrate with Javascript's asynchronous event loop

## Hello World

Here is the simplest `twr-wasm` example.

```c title="helloworld.c"
#include <stdio.h>

void hello() {
    printf("hello, world!\n");
}
```

```html title="index.html"
<head>
   <title>Hello World</title>
</head>
<body>
   <div id="twr_iodiv"></div>

   <script type="module">
      import {twrWasmModule} from "twr-wasm";
      
      const mod = new twrWasmModule();
      await mod.loadWasm("./helloworld.wasm");
      await mod.callC(["hello"]);
   </script>
</body>
```

## On Github
[https://github.com/twiddlingbits/twr-wasm](https://github.com/twiddlingbits/twr-wasm)

## Why?
The [Wasm Runtime Limitations](more/wasm-problem.md) section explains why a library like twr-wasm is needed to use WebAssembly.

## Version 2 vs. 1
 - libc++ built for WebAssembly is included
 - most of the standard C library is now implemented
 - instructions for WebAssembly C/C++ source level debugging
 - version of library with debug symbols provided
 - locale, UTF-8, and windows-1252 support

## Version 2 Limitations 
 - libc++ not built with exceptions enabled
 - some standard C library functions are not 100% implemented
 - Designed to work with a browser.  Not tested with or designed to work with node.js  
 - Not all of compile-rt is ported (but most bits you need are)
 - The following non-compatible changes since 1.0 (relatively minor)
    - there is no longer 'twr_' prefixed std c lib functions (use the normal std c lib names)
    - most 'twr_wasm_' prefixed functions have been shortened to 'twr_'.  
    - some functions were renamed or changed slightly to be more consistent, but no functionality is lost.

## Post Feedback
Please post feedback (it worked for you, didn't work, requests, questions, etc) at [https://github.com/twiddlingbits/twr-wasm/](https://github.com/twiddlingbits/twr-wasm/)

