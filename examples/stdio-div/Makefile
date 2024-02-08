
TARGET := helloworld.wasm
CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17  -I ../../include 

default: $(TARGET)

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

$(TARGET): helloworld.o
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o helloworld.bc helloworld.o ../../lib-c/twr.a
# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj helloworld.bc -o helloworld-wasm.o
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld helloworld-wasm.o -o $(TARGET)  --no-entry --allow-undefined  --import-memory --export=hello --export=twr_wasm_malloc --export=twr_wasm_init

# at this point done with webassembly c build, now bundle js and prep dist folder
# verify lib-js is built
	cd ../../ && $(MAKE)
# use parcel bundler to bundle lib-js with index.html
	parcel build index.html 
	cp helloworld.wasm dist
# copy simple python test server that correctly sets CORS headers needed by SharedArrayBuffer
	 cp ../server.py dist
# to run, from the shell cd dist and type 'python server.py', then load http://localhost:8000/ in your browser

clean:
	rm -f $(TARGET)
	rm -f *.o
	rm -f *.bc
	rm -f dist/*
	rm -f .parcel-cache/*
	