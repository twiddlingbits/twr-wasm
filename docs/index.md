---
title: Easier WebAssembly with twr-wasm - Documentation and Examples
description: An easier way to create C/C++ WebAssembly. Unlike emscripten, use clang directly. Examples of blocking functions, 2D drawing, char I/O with <div> tag, etc.
---

# Easier WebAssembly with twr-wasm<br>Documentation and Examples
 
## Easier C/C++ WebAssembly
Version 2.5.0

twr-wasm is a simple, lightweight and easy to use library for building C/C++ WebAssembly code directly with clang. Run C/C++ code in a web browser. Legacy code, libraries, full applications, or single functions can be integrated with JavaScript and TypeScript. twr-wam solves some common use cases with less work than the more feature rich emscripten. 

**Key Features:**

- compile and link C/C++ for use with WebAssembly using clang directly (no wrapper)
- with JavaScript/Typescript load Wasm modules, call C/C++ functions, and access wasm memory
- comprehensive console support for `stdin`, `stdio`, and `stderr`.
- the optional `class twrWasmModuleAsync` can be used to:
      - integrate CLI C/C++ code with JavaScript
      - integrate synchronous blocking C/C++ code into the asynchronous JavaScript Main loop.
      - `await` on blocking C/C++ functions. 
- localization support, UTF-8, and windows-1252 support
- in C/C++, print and get characters to/from `<div>` tags in your HTML page
- in C/C++, print and get characters to/from a `<canvas>` based "terminal"
- in C/C++ use 2D drawing API compatible with JavaScript Canvas
- in C/C++ use Audio playback APIs
- create your own C/C++ APIs using TypeScript by extending `twrLibrary`
- standard C library for WebAssembly
- libc++ built for WebAssembly
- comprehensive examples and documentation

## Live WebAssembly Examples and Source

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](https://twiddlingbits.dev/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) |
| Maze Gen/Solve (Win32 C Port) | [View live maze](https://twiddlingbits.dev/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/maze) |
| Input/Output with `<div>` | [View square demo](https://twiddlingbits.dev/examples/dist/divcon/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/divcon) |
|I/O to terminal with `<canvas>`|[View demo](https://twiddlingbits.dev/examples/dist/terminal/index.html) |[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/terminal) |
|CLI using libc++ and `<canvas>`)| [View console](https://twiddlingbits.dev/examples/dist/tests-user/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-user) |

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

## Post Feedback
Please post feedback (it worked for you, didn't work, requests, questions, etc) at [https://github.com/twiddlingbits/twr-wasm/](https://github.com/twiddlingbits/twr-wasm/)

