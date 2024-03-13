
# tested with mingw32-make using windows

CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

.PHONY: wasm bundle

default: maze-script.js maze.wasm

maze-script.js: index.html maze-script.ts
	tsc

%.o: %.c winemu.h maze.h stack.h
	$(CC) $(CFLAGS)  $< -o $@

maze.wasm: maze.o stack.o winemu.o
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o maze.bc maze.o winemu.o stack.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj maze.bc -o maze-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behavior of the ELF lld. 
	wasm-ld  maze-wasm.o -o maze.wasm \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=CalcMaze --export=SolveBegin --export=SolveStep
	
# bundle using parcel v2
PUBLIC_URL:= ./
bundle: default
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html
	cp maze.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.js
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache
	