# C/C++ Runtime for Web Assembly
**Docs for tiny-wasm-runtime Version 2.0.1**

tiny-wasm-runtime is a simple, lightweight and easy to use C/C++ library for building Web Assembly code directly with clang. It solves some common use cases with less work than the more feature rich emscripten. tiny-wasm-runtime is easy to understand, and has some cool features. You can input and print streaming character i/o to a `<div>` tag, use a `<canvas>` element as an ANSI terminal, or use a C/C++ 2D drawing api (that is compatible with JavaScript Canvas APIs) to draw to a `<canvas>` element. You can run blocking C/C++. 

tiny-wasm-runtime allows you to run C/C++ code in a web browser. Legacy code, libraries, full applications, or single functions can be integrated with JavaScript and Typescript.

tiny-wasm-runtime is designed to be used with the standard llvm clang compiler and tools.

## C++ Bouncing Balls Demo
[View bouncing balls here](/examples/dist/balls/index.html)

## Key Features
   - compile C/C++ for use with web assembly using clang directly
   - standard C library, libc++. and purpose built APIs
   - Localization support, UTF-8, and windows-1252 support
   - load web assembly modules, and call their C/C++ functions from JavaScript (with parameter conversion as needed)
   - in C/C++, printf and get characters to/from `<div>` tags in your HTML page
   - in C/C++, printf and get characters to/from a `<canvas>` based "terminal"
   - in C/C++ use 2D drawing API compatible with JavaScript Canvas
   - in C/C++, use the "blocking loop" pattern and integrate with JavaScript's asynchronous event loop

## Why?
[The Wasm Problem](more/wasm-problem.md) section explains why a C/C++  Runtime is needed for Web Assembly.

## Hello World
Here is the simplest tiny-wasm-runtime example.

C code:

~~~
   #include <stdio.h>

   void hello() {
      printf("hello world\n");
   }
~~~

index.html:
~~~
<head>
   <title>Hello World</title>
</head>
<body>
   <div id="twr_iodiv"></div>

   <script type="module">
      import {twrWasmModule} from "tiny-wasm-runtime";
      
      const mod = new twrWasmModule();
      await mod.loadWasm("./helloworld.wasm");
      await mod.callC(["hello"]);
   </script>
</body>
~~~

## View Live Demos

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/balls) |
| Maze (Win32 C Port) | [View live maze](/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/maze) |
| Input from `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-div) |
|Mini-Terminal (hello world using `<canvas>`)|[View demo](/examples/dist/stdio-canvas/index.html) |[Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-canvas) |
|Mini-Terminal (interactive console using libc++)| [View console](/examples/dist/tests-user/index.html) | [Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/tests-user) |


## On Github
[https://github.com/twiddlingbits/tiny-wasm-runtime](https://github.com/twiddlingbits/tiny-wasm-runtime)

## Version 2.0 vs. 1.0
   - libc++ for wasm/clang is now available
   - most of the standard C library is now implemented
   - instructions for source level debugging
   - version of library with debug symbols provided
   - locale, UTF-8, and windows-1252 support

## Version 2.0.0 Limitations 
   - libc++ not built with threads, rtti, exceptions, unicode, or wide char support
   - some standard C library functions are not 100% implemented
   - Designed to work with a browser.  Not tested with or designed to work with node.js  
   - Not all of compile-rt is ported (but most bits you need are)
   - The following non-compatible changes since 1.0 (relatively minor)
      - there is no longer 'twr_' prefixed std c lib functions (use the normal std c lib names)
      - most 'twr_wasm_' prefixed functions have been shortened to 'twr_'.  
      - some functions were renamed or changed slightly to be more consistent, but no functionality is lost.

## Post Feedback

Please post feedback (it worked for you, didn't work, requests, questions, etc) at [https://github.com/twiddlingbits/tiny-wasm-runtime/](https://github.com/twiddlingbits/tiny-wasm-runtime/)

