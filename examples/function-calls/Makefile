
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling
TWRCFLAGS := --target=wasm32 -fno-exceptions -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3  $(TWRCFLAGS)

.PHONY: wasm bundle

wasm: function-calls.wasm

function-calls.o: function-calls.c
	$(CC) $(CFLAGS)  $< -o $@

function-calls.wasm: function-calls.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behavior of the ELF lld. 
	wasm-ld function-calls.o ../../lib-c/twr.a -o function-calls.wasm  \
		--no-entry --initial-memory=1048576 --max-memory=1048576 \
		--export=function_calls --export=get_structu32 --export=get_structu8 

# twrWasmModuleAsync uses shared memory
	wasm-ld function-calls.o ../../lib-c/twr.a -o function-calls-a.wasm  \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=function_calls --export=get_structu32 --export=get_structu8 
	
# bundle using parcel v2
PUBLIC_URL:= ./
bundle: wasm
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html async.html
	cp function-calls.wasm dist
	cp function-calls-a.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache
	