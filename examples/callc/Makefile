
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by twr-wasm
# -nostdlib Disable standard c library, provided by twr-wasm
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols  (also good to use twrd.a -- debug twr.a lib -- in this case)
# -v verbose
CFLAGS := -c -Wall -g  $(TWRCFLAGS)

.PHONY: wasm bundle

wasm: callc.wasm

callc.o: callc.c
	$(CC) $(CFLAGS)  $< -o $@

callc.wasm: callc.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behavior of the ELF lld. 
	wasm-ld callc.o ../../lib-c/twrd.a -o callc.wasm  \
		--no-entry --initial-memory=1048576 --max-memory=1048576 

# twrWasmModuleAsync uses shared memory
	wasm-ld callc.o ../../lib-c/twrd.a -o callc-a.wasm  \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 
	
clean:
	rm -f *.o
	rm -f *.wasm
	