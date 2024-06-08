
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
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: default

default: helloworld.wasm

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@
# use CFLAGS_DEBUG to build with debug symbols


helloworld.wasm: helloworld.o 
	wasm-ld  helloworld.o ../../lib-c/twr.a -o helloworld.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=hello 
# use ../../lib-c/twrd.a to link to debug symbol version of tiny-wasm-runtime

clean:
	rm -f *.o
	rm -f *.wasm

	