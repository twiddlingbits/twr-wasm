# Compiler, Linker and Memory
tiny-wasm-runtime uses clang directly, without a wrapper.  This section describes the needed compile and link options.  You can also take a look at the [example makefiles](../examples/examples-overview.md).

## clang with C
clang should include the following compile options to use tiny-wasm-runtime with C code.

~~~
 --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
~~~

-isystem should point to the folder `tiny-wasm-runtime/include`.  The option line above uses a relative link to `include` that works if your project is a sub folder in the `examples` folder.

If you installed using npm, then includes are at `node_modules/tiny-wasm-runtime/include` (see the [installation note on npm](installation.md)).

You will also need to link to `twr.a` (explained in the linking section below).

## clang with C++
When compiling C++ code:
~~~
 --target=wasm32 -fno-exceptions -fno-rtti -nostdlibinc -nostdinc -nostdlib -isystem  ../../include
~~~

You will also need to link to `twr.a` and `libc++.a` (explained in the linking section below).

Be sure to adjust the path to `twr.a`, `libc++.a`, and the `include` folder as needed (see above note in the C section).

## linking
Use the wasm-ld linker.

All of the tiny-wasm-runtime functions are staticly linked from the library `lib-c/twr.a`.  There is also a version ( `lib-c/twrd.a` ) of tiny-wasm-runtime library available with debug symbols.  One of these two static libraries should be added to the list of files to link (normally this is `twr.a`).  Both versions are built with asserts enabled.  `twr.a` is built with `-O3`.  `twrd.a` is built with `-g -O0`.

To use `libc++`, link to `libc++.a` (see the tests-libcxx example makefile).

C functions that you wish to call from JavaScript should either have an `-export` option passed to `wasm-ld`, or you can use the `__attribute__((export_name("function_name")))` option in your C function definition.

All exported functions to JavaScript should be C linkage (`extern "C"` if using C++).

wasm-ld should also be passed the following options:

**If Using twrWasmModule:**
~~~
--no-entry --initial-memory=<size> --max-memory=<size>
~~~

**If Using twrWasmModuleAsync:**
~~~
--no-entry --shared-memory --no-check-features --initial-memory=<size> --max-memory=<size>
~~~

## Memory
You set the memory size for your module (`WebAssembly.Memory`) using `wasm-ld` options as follows (this examples sets your wasm memory to 1MB).  The memory size should be a multiple of 64*1024 (64K) chunks.

if using `twrWasmModule`:
~~~
--initial-memory=1048576 --max-memory=1048576
~~~

If you are using `twrWasmModuleAsync`, shared memory must also be enabled. Like this:
~~~
--shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576
~~~

See this [production note on using shared memory](../more/production.md).

The memory is an export out of the `.wasm` into the JavaScript code.  There is no support
for automatically growing memory.

You can change your C/C++ stack size from the default 64K with the following `wasm-ld` option.   This example sets the stack at 128K
~~~
 -z stack-size=131072
~~~

You can print your module memory map, heap stats, and stack size using the function from C:
~~~
void twr_mem_debug_stats(struct IoConsole* outcon);
~~~
You can call it from Javascript with the output sent to the debug console (stderr) like this:
~~~
twrWasmModule/Async.callC(["twr_wasm_print_mem_debug_stats"])
~~~

twrWasmModule and twrWasmModuleAsync expose `malloc` as an async function, as well as the Web Assembly Module memory as:
~~~
async malloc(size:number);

memory?:WebAssembly.Memory;
mem8:Uint8Array;
mem32:Uint32Array;
memD:Float64Array;
~~~
to call `free()` from JavaScript (you probably won't need to), you can use:
~~~
twrWasmModule/Async.callC("twr_free", index);  // index to memory to free, as returned by malloc
~~~  

