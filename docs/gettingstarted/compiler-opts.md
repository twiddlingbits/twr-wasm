---
title: WebAssembly Compiling, Linking, and Memory Options
description: Learn to compile and link a WebAssembly module using clang and wasm-ld. Learn debug options, memory and stack size options.
---

# Compiling, Linking, and Memory Options
This section describes how to use `clang` to compile C/C++ code for WebAssembly, and how to use `wasm-ld` to link your files into a .wasm module, when using twr-wasm.

twr-wasm lets you use clang directly, without a wrapper.  This section describes the needed clang compile options and the wasm-ld link options.  You can also take a look at the [example makefiles](../examples/examples-overview.md).

## Compiler Notes
twr-wasm has been tested with clang 17.0.6 and wasm-ld 17.0.6.

If you are using nix, the default clang packages are wrapped with flags that break compilation. The following packages don't have this issue:

- llvmPackages_18.clang-unwrapped (clang 18.1.7)
- llvmPackages_17.clang-unwrapped (clang 17.0.6)

## C clang Compiler Options
When compiling C code with clang for use with Wasm and twr-wasm, use these clang options:
~~~
 --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
~~~

Here is an example of a compile command:
~~~sh
clang --target=wasm32 -nostdinc -nostdlib -isystem ./node_modules/twr-wasm/include -c  helloworld.c -o helloworld.o
~~~

`-isystem` should be adjusted to point to where the folder `twr-wasm/include` is installed. For example:

- `../../include` is a relative link to `include` that works if your project is a sub folder in the `examples` folder. 
- `./node_modules/twr-wasm/include` assumes you installed with `npm` into your project folder. (see the [Hello World Walk Through](helloworld.md)).

## C++ clang Compiler Options
When compiling C++ code with clang for use with Wasm and twr-wasm, use these clang options:
~~~
 --target=wasm32 -fno-exceptions -nostdlibinc -nostdinc -nostdlib -isystem  ../../include
~~~

## wasm-ld Linker Options
Use the wasm-ld linker directly with twr-wasm.

For example:
~~~sh
wasm-ld  helloworld.o ./node_modules/twr-wasm/lib-c/twr.a -o helloworld.wasm  --no-entry --initial-memory=131072 --max-memory=131072 --export=hello 
~~~

For C and C++ link to `twr.a` to link to the twr-wasm library.

For C++ link to `libc++.a` if you are using libc++. (see the [tests-libcxx example makefile](../examples/examples-libcxx.md)).

Be sure to adjust the path to `twr.a` and `libc++.a` as needed to the location where `twr-wasm/lib-c/` is installed. 

All of the twr-wasm functions are staticly linked from the library `lib-c/twr.a`.  There is also a version ( `lib-c/twrd.a` ) of twr-wasm library available with debug symbols.  One of these two static libraries should be added to the list of files to link (normally this is `twr.a`).  Both versions are built with asserts enabled.  `twr.a` is built with `-O3`.  `twrd.a` is built with `-g -O0`.

C functions that you wish to call from JavaScript should either have an `-export` option passed to `wasm-ld`, or you can use the `__attribute__((export_name("function_name")))` option in your C function definition.

All exported functions to JavaScript should be C linkage (`extern "C"` if using C++).

wasm-ld should be passed the following options:

**If Using twrWasmModule:**
~~~
--no-entry --initial-memory=<size> --max-memory=<size>
~~~

**If Using twrWasmModuleAsync:**
~~~
--no-entry --shared-memory --no-check-features --initial-memory=<size> --max-memory=<size>
~~~

## Memory Options (Memory Size, Stack Size, etc)
`WebAssembly.Memory` contains all the data used by your code (including the data needs of staticly linked libraries such as twr-wasm or libc++), but it does not store your actual code. It provides a contiguous, mutable array of raw bytes. Code execution and storage in WebAssembly are handled separately using the `WebAssembly.Module` and `WebAssembly.Instance` objects. The code (compiled WebAssembly instructions) is stored in the `WebAssembly.Module`, while `WebAssembly.Memory`is used to manage the linear memory accessible to the WebAssembly instance for storing data. Examples of data include your static data (.bss section or the .data section), the heap (used by `malloc` and `free`), and the stack (used for function calls and local variables).

The memory size should be a multiple of 64*1024 (64K) chunks. "initial-memory" and "max-memory" should be set to the same number since there is no support for automatically growing memory in twr-wasm.  The memory is an export out of the `.wasm` into the JavaScript code -- you should not create or set the size of `WebAssembly.Memory` in JavaScript when using twr-wasm.

You set the memory size for your module (`WebAssembly.Memory`) using `wasm-ld` options as follows (this examples sets your Wasm memory to 1MB).

### twrWasmModule
if using `twrWasmModule`:
~~~
--initial-memory=1048576 --max-memory=1048576
~~~

### twrWasmModuleAsync
If you are using `twrWasmModuleAsync`, shared memory must also be enabled. Like this:
~~~
--shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576
~~~

See this [note on CORS headers with shared memory](../more/production.md).

### Stack Size
You can change your C/C++ stack size from the default 64K with the following `wasm-ld` option.   This example sets the stack at 128K
~~~
 -z stack-size=131072
~~~

### Print Memory Map
You can print your module memory map, heap stats, and stack size using the function from C:
~~~
void twr_mem_debug_stats(twr_ioconsole_t* outcon);
~~~
There is a variation of `twr_mem_debug_stats` that will use `stderr` as the console.   You can call it from Javascript like this:
~~~
twrWasmModule/Async.callC(["twr_wasm_print_mem_debug_stats"])
~~~

### TypeScript/JavaScript malloc and Memory Access
[See here for malloc, free, and memory access](../api/api-ts-memory.md)



