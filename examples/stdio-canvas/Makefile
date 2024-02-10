
# tested with mingw32-make using windows

TARGET := stdio-canvas.wasm
CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17  -I ../../include 

default: $(TARGET)

stdio-canvas.o: stdio-canvas.c
	$(CC) $(CFLAGS)  $< -o $@

$(TARGET): stdio-canvas.o
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o stdio-canvas.bc stdio-canvas.o ../../lib-c/twr.a
# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj stdio-canvas.bc -o stdio-canvas-wasm.o
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld stdio-canvas-wasm.o -o $(TARGET)  --no-entry --allow-undefined  --import-memory --export=stdio_canvas --export=twr_wasm_malloc --export=twr_wasm_init

# at this point done with webassembly c build, now bundle js and prep dist folder
# verify lib-js is built
	cd ../../ && $(MAKE)
# use parcel bundler to bundle lib-js with index.html
	parcel build --dist-dir dist index.html 
	cp stdio-canvas.wasm dist
# copy simple python test server that correctly sets CORS headers needed by SharedArrayBuffer
	 cp ../server.py dist
# to run, from the shell cd dist and type 'python server.py', then load http://localhost:8000/ in your browser

clean:
	rm -f $(TARGET)
	rm -f *.o
	rm -f *.bc
	rm -f dist/*
	rm -f .parcel-cache/*
	