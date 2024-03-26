
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling
TWRCFLAGS := --target=wasm32 -fno-exceptions -nostdinc -nostdlib -isystem  ../../include

# -c compile w/o linking
# -Wall Warn all
# -O3 Optimization level 3
CFLAGS := -c -Wall -O3  $(TWRCFLAGS)

PUBLIC_URL:= ./

.PHONY: wasm bundle

wasm: helloworld.wasm

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

helloworld.wasm: helloworld.o 
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  helloworld.o ../../lib-c/twr.a -o helloworld.wasm \
		--no-entry 	--initial-memory=131072 --max-memory=131072 \
		--export=hello 

# bundle using parcel v2
bundle: wasm
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html 
	cp helloworld.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache

	