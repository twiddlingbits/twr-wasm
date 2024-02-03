# Tiny Web Assembly Runtime (twr)
This twr library allows you to easily port or run C code in a web browser.

The recommended library for compiling C code to Web Assembly is emscripten (there is also the WASI in the works.)  emscripten is much more full featured than TWR, but also more complex.   You might prefer TWR if you want a simpler, easier to understand runtime.  Or if you prefer its method of HTML/JS integration.

They key TWR features include:
   - A subset of the standard C runtime, including printf, getch, malloc, string functions, etc.
   - Optionally integrates traditional "blocking big loop" C code structure into HTML/Javascript's asynchronous event model (via use of worker thread and various proxy messages)
   - Print and get character based I/O from/to \<div\> tags in your HTML Page
   - Print and get character based I/O from/to a \<canvas\> based "terminal"
   - TO FINISH - optionally receive asynchronous events and draw to a 2D \<canvas\>
  
# The Web Assembly Problem
HTML browsers can load a Web Assembly module, and execute it's bytecode in a browser virtual machine.  You compile your code using clang with the target code format being web assembly (wasm) byte code.   There are a few issues that one immediately encounters trying to execute code that is more complicated than squaring a number.  

The first is that there is no runtime support.  That is, no malloc or printf or similar functions.  Even beyond than that, there are no included compiler support  functions.  That is, clang code generation will produce calls for floating point operations, memcpy, and other utility code.  This code is usually handled behind the scenes for you.  For example, gcc will link to the "gcc" lib automatically.  clang typically uses "compile-rt".  This doesn't happen with Web Assembly compiles.

The second problem is that all the function calls between your wasm module and your javascript are limited to parameters that are numbers (integer and float) and also for their return values. No strings, arrays, struct pointers, etc.

The third problem is that legacy C code or games often block, and when written this way they don't naturally integrate with the Javascript asynchronous programming model.

TWR is static library that you can link to your clang code, that solves these issues.   TWR provides:
   - a (tiny) C runtime library along with 
   - a (tiny) subset of the most common compiler utility functions. 
   - APIs that can be used to pass strings, byte arrays, etc to and from your C code to and from typescript/javascript.
   - APIs for integrating I/O and events between C and Javascript.
   - an optional asynchronous web assembly typescript/javascript class that executes your compiled code in a worker thread with integration into the primary javascript event loop

# TWR Limitations
I created twr to run some of my legacy C software in a web browser.  It doesn't implement many features beyond what I needed.  For example, I didn't port all of compile-rt, just the small subset clang needed to build and run my software.  Presumably there will be code that won't run as a result.  In addition, I didn't write an entire ANSI-C compatible runtime (or port one).  I wrote my own and left out some (many?) functions.  I also cut some corners in places I thought didn't matter for wasm.  For example, my malloc allocator is, well, tiny.  

# Supported Platforms
I wrote this using Windows, but it should work with any clang / typescript compatible platform.

If you are using windows, here is the software I installed to do a build.

- to do - 

# Basic steps to integrate your C code with your HTML/JS code
1. Compile your C code with clang and link to twr.a (specifics below)
2. You may (or may not) need small proxy C functions that provide the API between your C code and the Javascript side.
3. On the HTML side you:
   1. add a \<div\> named 'twr_stdio' (there are other options, this is the simplest)
   2. use "new twrWasmAsyncModule()", followed by loadWasm(), then executeC().

# Hello World
< to do >

# More examples
< to do >

# How to compile your C code
< to do>

# Overview of APIs




