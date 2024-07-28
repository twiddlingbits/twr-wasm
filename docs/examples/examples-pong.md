---
title: Pong - Game written in C++ using WebAssembly
description: A 2D drawing WebAssembly C/C++ example of singleplayer Pong using Canvas like 2D API with twr-wasm
---

# Pong - 2D Game Example
Similar to the [balls example](examples-balls.md), this example uses twr-wasm's 2D Draw API and a C++ canvas class to run a simple game of singleplayer Pong.

* [View Pong](/examples/dist/pong/index.html)
* [Source for Pong](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/pong)

The Pong example demonstrates

* C++
* Using twr-wasm draw 2D APIs that match Javascript Canvas APIs.
* Using the twr-wasm canvas.cpp class.
* Taking in Javascript events as user input

This example does not use libc++, which results in smaller code size.   For an example that uses libc++ see [tests-libcxx](examples-libcxx.md).

## Screen Grab of Pong Example
 <img src="../../img/readme-img-pong.png">
