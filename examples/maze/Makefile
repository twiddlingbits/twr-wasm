
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by twr-wasm
# -nostdlib Disable standard c library, provided by twr-wasm
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O0 Optimization off
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols  (also good to use twrd.a -- debug twr.a lib -- and optimization off -- in this case)
# -v verbose
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: wasm

default: maze-script.js maze.wasm

maze-script.js: index.html maze-script.ts
	tsc

%.o: %.c winemu.h maze.h stack.h
	$(CC) $(CFLAGS)  $< -o $@

maze.wasm: maze.o stack.o winemu.o
	wasm-ld  maze.o winemu.o stack.o ../../lib-c/twr.a -o maze.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=CalcMaze --export=SolveBegin --export=SolveStep
	
clean:
	rm -f *.o
	rm -f *.js
	rm -f *.wasm
	rm -f *.map

	