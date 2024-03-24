
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

default: maze-script.js maze.wasm

maze-script.js: index.html maze-script.ts
	tsc

%.o: %.c winemu.h maze.h stack.h
	$(CC) $(CFLAGS)  $< -o $@

maze.wasm: maze.o stack.o winemu.o
# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behavior of the ELF lld. 
	wasm-ld  maze.o winemu.o stack.o ../../lib-c/twr.a -o maze.wasm \
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
	rm -f *.js
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache
	