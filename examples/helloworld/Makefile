
# tested with mingw32-make using windows
# to run after executing make, from the shell cd dist and type 'python server.py', then load http://localhost:8000/ in your browser
# to build you will need to install npm, parcel, clang and you will need to 
# run shell command "npm install" from this folder containing package.json to install the dependent node_modules


TARGET := dist/index.html
CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

default: $(TARGET)

# bundle using parcel
$(TARGET): index.html helloworld.wasm
	npm install
	parcel build --dist-dir dist index.html 

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

helloworld.wasm: helloworld.o 
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o helloworld.bc helloworld.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj helloworld.bc -o helloworld-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  helloworld-wasm.o -o helloworld.wasm \
		--no-entry --allow-undefined  --import-memory \
		--shared-memory --no-check-features --max-memory=6553600 \
		--export=twr_wasm_malloc --export=twr_wasm_init \
		--export=hello 

	mkdir -p dist
	cp helloworld.wasm dist

# copy simple python test server that correctly sets CORS headers needed by SharedArrayBuffer
	 cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f dist/*
	rm -f .parcel-cache/*

	