
# tested with mingw32-make using windows

OBJ := gamefield.o ball.o canvas.o heart.o opnew.o

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling
TWRCFLAGS := --target=wasm32 -fno-exceptions -nostdlibinc -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3  $(TWRCFLAGS)

OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))
OBJ := $(patsubst %, $(OBJOUTDIR)/%, $(OBJ))
$(info $(OBJ))

default: balls.wasm

$(OBJOUTDIR)/%.o: %.cpp
	clang $(CFLAGS)  $< -o $@

balls.wasm: $(OBJ)
# twrWasmModule version (building both for testing)
	wasm-ld  $(OBJ) ../../lib-c/twr.a -o balls.wasm \
		--no-entry --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move
		
# twrWasmModuleAsync version (building both for testing)
	wasm-ld  $(OBJ) ../../lib-c/twr.a -o balls-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move 

PUBLIC_URL:= ./
bundle: default
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html async.html
	cp balls.wasm dist
	cp balls-a.wasm dist
	cp ../server.py dist

clean:
	rm -f *.wasm
	rm -r -f dist
	rm -r -f .parcel-cache
	rm -r -f $(OBJOUTDIR)

		