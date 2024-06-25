<h1> WebAssembly C/C++ Examples</h1>
These C and C++ examples demonstrate how to create different types of WebAssembly (wasm) programs with the twr-wasm library.

These are good examples to use as starting points for your own wasm projects.

These examples are a good place to learn how to configure clang and wasm-ld to compile and link C/C++ code for use with WebAssembly (wasm).

<h1>Example Quick Links</h1>
- [Click here to view C/C++ WebAssembly twr-wasm examples running live](https://twiddlingbits.dev/examples/dist/index.html)
- [Click here to view source code and make files](https://github.com/twiddlingbits/twr-wasm/tree/main/examples)

<h1>Examples Overview</h1>
Each of these examples are designed to illustrate how to use a feature of twr-wasm.


| Name | Description | Link |
| -----| ----------- | ---- |
| helloworld | A very simple C wasm example to get you started | [helloworld](examples-helloworld.md) |
| stdio-div | This simple C program demos inputting and<br>printing characters to a `div` tag | [stdio-div](examples-stdio-div.md) |
| stdio-canvas |This simple C program demos writing and inputting<br>from a `<canvas>` tag that twr-wasm configures<br>as a windowed "mini-terminal" | [stdio-canvas](examples-stdio-canvas.md)|
| balls | These fun Bouncing Balls are written in C++ and demo the<br>2D drawing APIs with a C++ Canvas wrapper class | [balls](examples-balls.md) |
| maze | This is an old Win32 program ported to wasm<br>and demos the 2D Draw APIs | [maze](examples-maze.md) |
| fft | A demo of calling a C library to perform an FFT<br>that is graphed in Typescript | [fft](examples-fft.md) |
| callC | A demo of passing and returning values between<br>JavaScript and WASM module | [callc](examples-callc.md) |
| tests | twr-wasm unit tests | [tests](/examples/dist/tests/index.html) |
| tests-user | "cli" for tests using libc++ and `<canvas>` | [tests-user](/examples/dist/tests-user/index.html) |
| tests-libcxx | Smoke test for libc++.  Shows how to use libc++. | [tests-libcxx](examples-libcxx.md) |

<h1>Building the Examples</h1>

See [Example Readme](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/readme.md) for more information on building and running the examples. 
