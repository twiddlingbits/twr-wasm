---
title: Bouncing Balls - WebAssembly C++ 2D Draw Example
description: A 2D drawing WebAssembly C/C++ example of bouncing and dividing balls using Canvas like 2D API with twr-wasm
---

# Bouncing Balls - 2D Draw API Wasm Example
This example uses twr-wasm's 2D Draw API and a C++ Canvas class with WebAssembly and C++ to bounce balls around your HTML page.

* [View bouncing balls](/examples/dist/balls/index.html) 
* [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) 

The bouncing balls example demonstrates

* C++
* Using the twr-wasm draw 2D APIs that match Javascript Canvas APIs.
* Using the twr-wasm canvas.cpp wrapper class.


This example does not use libc++, which results in smaller code size.   For an example that uses libc++ see [tests-libcxx](examples-libcxx.md).

## Screen Grab of Balls Example
 <img src="../../img/readme-img-balls.png" width="500">

