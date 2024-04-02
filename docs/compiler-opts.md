# Compiler, Linker and Memory
tiny-wasm-runtime uses clang directly, without a wrapper.  This section describes the needed compile and link options.  You can also take a look at the [examples](examples-overview.md).

## clang with C
clang should include the following compile options to use tiny-wasm-runtime with C code.

-isystem should point to the folder tiny-wasm-runtime/include

If you installed using npm, then includes are at node_modules/tiny-wasm-runtime/include  

~~~
 --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
~~~


## clang with C++
add -nostdlibinc and -fno-exceptions.

-fno-exceptions is not a required compile option, but will reduce your code size. And tiny-wasm-runtime doesn't have support for exceptions in c++.

~~~
 --target=wasm32 -fno-exceptions -nostdlibinc -nostdinc -nostdlib -isystem  ../../include
~~~
## linking with wasm-ld
wasm-ld should be passed the following options:

~~~
--no-entry --initial-memory=<size> --max-memory=<size>
~~~

`lib-c/twr.a` should be added to the list of files to link.

C functions that you wish to call from Javascript should either have an `-export` option passed to `wasm-ld`, or you can use the `__attribute__((export_name("function_name")))` option in your C function definition.

All exported functions should be C linkage.

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

The memory is an export out of the `.wasm` into the Javascript code.  There is no support
for automatically growing memory.

You can change your C/C++ stack size from the default 64K with the following `wasm-ld` option.   This example sets the stack at 128K
~~~
 -z stack-size=131072
~~~

You can print your module memory map, heap stats, and stack size using the function:
~~~
 twr_wasm_print_mem_debug_stats()
~~~
You can also call it from JavaScript like this:
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

