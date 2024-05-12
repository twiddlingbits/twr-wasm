
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)

.PHONY: wasm bundle

wasm: tests.wasm

tests.o: tests.c
	$(CC) $(CFLAGS)  $< -o $@

tests.wasm: tests.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld tests.o ../../lib-c/twr.a -o tests.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=tests --export=sin_test

clean:
	rm -f *.o
	rm -f *.wasm

	