
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O0 Optimization off (default if no -O specified)
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols  (also good to use twrd.a -- debug twr.a lib -- and optimization off -- in this case)
# -v verbose
CFLAGS := -c -Wall -g $(TWRCFLAGS)

.PHONY: wasm bundle

wasm: tests.wasm

tests.o: tests.c
	$(CC) $(CFLAGS)  $< -o $@

tests.wasm: tests.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld tests.o ../../lib-c/twrd.a -o tests.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=tests --export=sin_test

clean:
	rm -f *.o
	rm -f *.wasm

	