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
| divcon | This simple C program demos inputting and<br>printing characters to a `div` tag | [divcon](examples-divcon.md) |
| terminal |This simple C program demos writing and inputting<br>from a `<canvas>` tag that twr-wasm configures<br>as a windowed "terminal" | [terminal](examples-terminal.md)|
| multi-io | Demo 6 simultaneous consoles: stream i/o, terminal, 2D Drawing | [multi-io](examples-multi-io.md)|

## Draw 2D Examples
| Name | Description | Link |
| -----| ----------- | ---- |
| balls | These fun Bouncing Balls are written in C++ and demo the<br>2D drawing APIs with a C++ Canvas wrapper class | [balls](examples-balls.md) |
| pong | A simple game of Pong written in C++ to demo 2D drawing APIs with a C++ canvas wrapper class and taking user input from JS | [pong](examples-pong.md)
| maze | This is an old Win32 program ported to wasm<br>and demos the 2D Draw APIs | [maze](examples-maze.md) |

## Call Argument Examples
| Name | Description | Link |
| -----| ----------- | ---- |
| callC | A demo of passing and returning values between<br>JavaScript and Wasm module | [callc](examples-callc.md) |
| fft | A demo of calling a C library to perform an FFT<br>that is graphed in TypeScript | [fft](examples-fft.md) |

### Unit Tests

| Name | Description | Link |
| -----| ----------- | ---- |
| tests | twr-wasm unit tests | [tests](/examples/dist/tests/index.html) |
| tests-user | "cli" for tests using libc++ and `<canvas>` | [tests-user](/examples/dist/tests-user/index.html) |
| tests-libcxx | Smoke test for libc++.  Shows how to use libc++. | [tests-libcxx](examples-libcxx.md) |

## Running the examples locally
To run the examples locally:

- [Install twr-wasm, clang, wasm-ld, python, make](../gettingstarted/installation.md)
- then from a shell with the repo root as the current directory, execute `python examples\server.py`.  This small python script is a local http server that also [sets the needed cors headers](../more/production.md)
- http://localhost:8000/examples/

## Building the Examples

See [Example Readme](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/readme.md) for more information on building and running the examples. 
