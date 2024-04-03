
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling,c++
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3  $(TWRCFLAGS)

.PHONY: wasm bundle

wasm: stdio-div.wasm

stdio-div.o: stdio-div.c
	$(CC) $(CFLAGS)  $< -o $@

stdio-div.wasm: stdio-div.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behavior of the ELF lld. 
	wasm-ld stdio-div.o ../../lib-c/twr.a -o stdio-div.wasm  \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=stdio_div 
	
clean:
	rm -f *.o
	rm -f *.wasm
	