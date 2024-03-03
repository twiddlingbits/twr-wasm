
# tested with mingw32-make using windows


CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

.PHONY: wasm bundle

wasm: stdio-canvas.wasm

stdio-canvas.o: stdio-canvas.c
	$(CC) $(CFLAGS)  $< -o $@

stdio-canvas.wasm: stdio-canvas.o 
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o stdio-canvas.bc stdio-canvas.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj stdio-canvas.bc -o stdio-canvas-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  stdio-canvas-wasm.o -o stdio-canvas.wasm  \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=twr_malloc --export=twr_free --export=twr_wasm_init \
		--export=stdio_canvas
	
# bundle using parcel v2
PUBLIC_URL:= ./
bundle: wasm
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html 
	cp stdio-canvas.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache
	