
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols  (also good to use twrd.a -- debug twr.a lib -- in this case)
# -v verbose
CFLAGS := -c -Wall -g  $(TWRCFLAGS)

.PHONY: wasm bundle

wasm: function-calls.wasm

function-calls.o: function-calls.c
	$(CC) $(CFLAGS)  $< -o $@

function-calls.wasm: function-calls.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behavior of the ELF lld. 
	wasm-ld function-calls.o ../../lib-c/twrd.a -o function-calls.wasm  \
		--no-entry --initial-memory=1048576 --max-memory=1048576 \
		--export=function_calls --export=get_structu32 --export=get_structu8 

# twrWasmModuleAsync uses shared memory
	wasm-ld function-calls.o ../../lib-c/twrd.a -o function-calls-a.wasm  \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=function_calls --export=get_structu32 --export=get_structu8 
	
clean:
	rm -f *.o
	rm -f *.wasm
	