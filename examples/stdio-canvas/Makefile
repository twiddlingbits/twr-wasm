
# tested with mingw32-make using windows
# to run after executing make, from the shell cd dist and type 'python server.py', then load http://localhost:8000/ in your browser
# to build you will need to install npm, parcel, clang and you will need to 
# run shell command "npm install" from this folder containing package.json to install the dependent node_modules


TARGET := dist/index.html
CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

default: $(TARGET)

# bundle using parcel
$(TARGET): index.html stdio-canvas.wasm
	npm install
	parcel build --no-cache --dist-dir dist index.html 

stdio-canvas.o: stdio-canvas.c
	$(CC) $(CFLAGS)  $< -o $@

stdio-canvas.wasm: stdio-canvas.o 
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o stdio-canvas.bc stdio-canvas.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj stdio-canvas.bc -o stdio-canvas-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  stdio-canvas-wasm.o -o stdio-canvas.wasm \
		--no-entry --allow-undefined  --import-memory \
		--shared-memory --no-check-features --max-memory=6553600 \
		--export=twr_malloc --export=twr_wasm_init \
		--export=stdio_canvas
	
	mkdir -p dist
	cp stdio-canvas.wasm dist

# copy simple python test server that correctly sets CORS headers needed by SharedArrayBuffer
	 cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.wasm
	rm -f dist/*
	rm -f .parcel-cache/*
	