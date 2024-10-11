---
title: Easier WebAssembly with twr-wasm - Documentation and Examples
description: An easier way to create C/C++ WebAssembly. await on blocking C/C++ code, 2D drawing and audio APIs, char I/O with <div> tag, more.
---

# Easier WebAssembly with twr-wasm<br>Documentation and Examples
Version 2.5.0

twr-wasm is a simple, lightweight and easy to use library for building C/C++ WebAssembly code directly with clang. Run C/C++ code in a web browser. Legacy code, libraries, full applications, or single functions can be integrated with JavaScript and TypeScript. twr-wam solves some common use cases with less work than the more feature rich emscripten. 

**Key Features:**

- build `.wasm` modules using C/C++ with clang directly (no wrapper)
- from JavaScript load `.wasm` modules, call C/C++ functions, and access wasm memory
- comprehensive console support for `stdin`, `stdio`, and `stderr`.

    - in C/C++, print and get characters to/from `<div>` tags in your HTML page
    - in C/C++, print and get characters to/from a `<canvas>` based "terminal"
    - localization support, UTF-8, and windows-1252 support

- the optional TypeScript `class twrWasmModuleAsync` can be used to:

    - integrate a C/C++ Read-Eval-Print Loop (REPL) with JavaScript
    - integrate a C/C++ CLI or Shell with JavaScript
    - In JavaScript `await` on blocking/synchronous C/C++ functions. 

- 2D drawing API for C/C++ compatible with JavaScript Canvas
- audio playback APIs for C/C++
- create your own C/C++ APIs using TypeScript by extending `class twrLibrary`
- standard C library optimized for WebAssembly
- libc++ built for WebAssembly
- comprehensive examples and documentation
- TypeScript and JavaScript support

## Live WebAssembly Examples and Source

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](https://twiddlingbits.dev/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) |
| Pong (C++) | [Pong](https://twiddlingbits.dev/examples/dist/pong/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/pong) |
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

## Limitations 
 - libc++ not built with exceptions enabled
 - some standard C library functions are not 100% implemented
 - Designed to work with a browser.  Not tested with or designed to work with node.js  
 - Not all of compile-rt is ported (but most bits you need are)

## Post Feedback
Please post feedback (it worked for you, didn't work, requests, questions, etc) at [https://github.com/twiddlingbits/twr-wasm/](https://github.com/twiddlingbits/twr-wasm/issues)

