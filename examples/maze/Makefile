
# tested with mingw32-make using windows
# to run after executing make, from the shell cd dist and type 'python server.py', then load http://localhost:8000/ in your browser
# to build you will need to install npm, parcel, clang and you will need to 
# run shell command "npm install" from this folder containing package.json to install the dependent node_modules


TARGET := dist/index.html
CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

default: $(TARGET)

# bundle using parcel
$(TARGET): index.html maze.wasm  ../../lib-c/twr.a
	npm install
	tsc
	parcel build --no-cache --dist-dir dist index.html 
	$(info Build Complete)

	

%.o: %.c winemu.h maze.h stack.h
	$(CC) $(CFLAGS)  $< -o $@

maze.wasm: maze.o stack.o winemu.o
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o maze.bc maze.o winemu.o stack.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj maze.bc -o maze-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  maze-wasm.o -o maze.wasm \
		--no-entry --allow-undefined  --import-memory \
		--shared-memory --no-check-features --max-memory=6553600 \
		--export=twr_malloc --export=twr_wasm_init \
		--export=CalcMaze --export=SolveBegin --export=SolveStep
	
	mkdir -p dist
	cp maze.wasm dist

# copy simple python test server that correctly sets CORS headers needed by SharedArrayBuffer
	 cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.js
	rm -f *.wasm
	rm -f dist/*
	rm -f .parcel-cache/*
	