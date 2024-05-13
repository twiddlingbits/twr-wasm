
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, For C++
# -fno-exceptions Don't generate stack exception code since libc++ and libcxxabi built without exceptions (and abi required for exceptions), C++
# -fno-rtti since libc++ built without runtime type info, C++
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -c compile w/o linking
# -Wall Warn all
# -O3 Optimization level 3
# -O0 Optimizatons off
# -g embed debug info
CFLAGS := -c -Wall -O3 -DNDEBUG  $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: both

both: helloworld.wasm helloworld-dbg.wasm 

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

helloworld-dbg.o: helloworld.c
	$(CC) $(CFLAGS_DEBUG)  $< -o $@

helloworld.wasm: helloworld.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  helloworld.o ../../lib-c/twr.a -o helloworld.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=hello 

helloworld-dbg.wasm: helloworld-dbg.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  helloworld-dbg.o ../../lib-c/twrd.a -o helloworld-dbg.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=hello 

clean:
	rm -f *.o
	rm -f *.wasm

	