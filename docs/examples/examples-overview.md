---
title: WASM C/C++ Examples
description: WebAssembly C/C++ examples including Hello World, stdio to div, stdio to canvas, Maze Generator, Bouncing Balls, Pong, FFT, Terminal, callC
---

# WebAssembly C/C++ Examples
## Overview
These C and C++ examples demonstrate how to create different types of WebAssembly (wasm) programs with the twr-wasm library.

These are good examples to use as starting points for your own Wasm projects.

These examples are a good place to learn how to configure clang and wasm-ld to compile and link C/C++ code for use with WebAssembly (wasm).

## Example Quick Links
- [Click here to view C/C++ WebAssembly twr-wasm examples running live](https://twiddlingbits.dev/examples/dist/index.html)
- [Click here to view source code and make files](https://github.com/twiddlingbits/twr-wasm/tree/main/examples)

## Hello World
| Name | Description | Link |
| -----| ----------- | ---- |
| helloworld | A very simple C Wasm example to get you started | [helloworld](examples-helloworld.md) |

## Console Examples
| Name | Description | Link |
| -----| ----------- | ---- |
| divcon | A simple C program demos inputting and printing characters to a `div` tag | [divcon](examples-divcon.md) |
| terminal |A simple C program demos writing and inputting from a `<canvas>` tag<br>that twr-wasm configures as a windowed "terminal" | [terminal](examples-terminal.md)|
| multi-io | Demo 6 simultaneous consoles: stream i/o, terminal, and 2D Drawing. | [multi-io](examples-multi-io.md)|

## Draw 2D and Audio Examples
| Name | Description | Link |
| -----| ----------- | ---- |
| balls | These fun Bouncing Balls are written in C++ and demo the 2D drawing<br>APIs with a C++ Canvas wrapper class | [balls](examples-balls.md) |
| pong | A simple game of Pong written in C++ to demo 2D drawing and Audio APIs with<br>a C++ canvas wrapper class and taking user input from JS | [pong](examples-pong.md)
| maze | This is an old Win32 program ported to wasm and demos 2D Draw APIs | [maze](examples-maze.md) |

## Call Argument Examples
| Name | Description | Link |
| -----| ----------- | ---- |
| callC | A demo of passing and returning values between JavaScript and Wasm module | [callc](examples-callc.md) |
| fft | A demo of calling a C library to perform an FFT that is graphed in TypeScript | [fft](examples-fft.md) |

## twrLibrary Examples
| Name | Description | Link |
| -----| ----------- | ---- |
| lib | A demo of createing a twrLibrary (use TypeScript to create C/C++ APIs) | [library](examples-lib.md) |


### Unit Tests

| Name | Description | Link |
| -----| ----------- | ---- |
| tests | twr-wasm unit tests | [tests](/examples/dist/tests/index.html) |
| tests-user | "cli" for tests using libc++ and `<canvas>` | [tests-user](/examples/dist/tests-user/index.html) |
| tests-libcxx | Smoke test for libc++.  Shows how to use libc++. | [tests-libcxx](examples-libcxx.md) |
| tests-d2d | Unit tests for Draw 2D canvas console | [tests-d2d](examples-tests-d2d.md) |
| tests-audio | Unit tests for the Audio Library | [tests-audio](examples-tests-audio.md) |

## Running or Building the examples locally
Online versions of the examples [can be viewed here.](https://twiddlingbits.dev/examples/dist/index.html)  

You can also run the [examples locally, or build them.](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/readme.md).

## Copying Examples to Start your own Project
All of the examples have makefiles that use a relative path for `twr.a` and `includes`. These paths will work fine if your code is in an examples sub-folder as a peer to the other examples.  But assuming your code is in your own project folder elsewhere, you will need to determine the correct path to `twr.a` and `includes` for your project's makefile.  Details on how to do this can be found in the following sections: [Hello World walk through](../gettingstarted/helloworld.md) and the [Compiler and Linker Options section](../gettingstarted/compiler-opts.md).

Also see the section on [Import Resolution](../more/imports.md) if you installed with `git clone.`

