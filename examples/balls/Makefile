
# tested with mingw32-make using windows

OBJ := balls.o canvas.o heart.o opnew.o

CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm  -I ../../include 

OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))
OBJ := $(patsubst %, $(OBJOUTDIR)/%, $(OBJ))
$(info $(OBJ))

default: balls.wasm

$(OBJOUTDIR)/%.o: %.cpp
	clang $(CFLAGS)  $< -o $@

balls.wasm: $(OBJ)
	llvm-link -o $(OBJOUTDIR)/balls.bc $(OBJ) ../../lib-c/twr.a
	llc -filetype=obj $(OBJOUTDIR)/balls.bc -o $(OBJOUTDIR)/balls-wasm.o

# twrWasmModule version (building both for testing)
	wasm-ld  $(OBJOUTDIR)/balls-wasm.o -o balls.wasm \
		--no-entry --allow-undefined  \
		--export=memory --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move

# twrWasmModuleAsync version (building both for testing)
	wasm-ld  $(OBJOUTDIR)/balls-wasm.o -o balls-a.wasm \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576  \
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

		