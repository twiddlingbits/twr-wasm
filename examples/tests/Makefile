
# tested with mingw32-make using windows

CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

PUBLIC_URL:= ./

.PHONY: wasm bundle

wasm: tests.wasm

tests.o: tests.c
	$(CC) $(CFLAGS)  $< -o $@

tests.wasm: tests.o 
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o tests.bc tests.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj tests.bc -o tests-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  tests-wasm.o -o tests.wasm \
		--no-entry --allow-undefined  \
		--export=memory --initial-memory=131072 --max-memory=131072 \
		--export=tests --export=sin_test

# bundle using parcel v2
bundle: wasm
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html 
	cp tests.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache

	