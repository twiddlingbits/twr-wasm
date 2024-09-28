---
title: Pong - Game written in C++ using WebAssembly
description: A 2D drawing WebAssembly C/C++ example Pong using Canvas like 2D API with twr-wasm
---

# Pong - 2D Game Example
Similar to the [balls example](examples-balls.md), this example uses twr-wasm's 2D Draw API and a C++ canvas class to implement a simple game of 2 player and single player Pong with WebAssembly.

* [View Pong](/examples/dist/pong/index.html)
* [Source for Pong](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/pong)

The Pong example demonstrates

* C++
* Using twr-wasm draw 2D APIs that match Javascript Canvas APIs.
* Using the twr-wasm canvas.cpp class.
* A custom typescript library
* User mouse and keyboard input via events
* Using the Audio Library to play simple sounds

This example does not use libc++, which results in smaller code size.   For an example that uses libc++ see [tests-libcxx](examples-libcxx.md).

## Screen Grab of Pong Example
  
 <img src="../../img/readme-img-menu-pong.png">
 <img src="../../img/readme-img-single-player-pong.png">
 <img src="../../img/readme-img-2-player-pong.png">
