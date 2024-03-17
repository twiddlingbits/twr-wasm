
# tested with mingw32-make using windows

CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm  -I ../../include 

OBJ := balls.o canvas.o heart.o opnew.o

default: balls.wasm

%.o: %.cpp
	$(CC) $(CFLAGS)  $< -o $@

balls.wasm: $(OBJ)
	llvm-link -o balls.bc $(OBJ) ../../lib-c/twr.a
	llc -filetype=obj balls.bc -o balls-wasm.o

# twrWasmModule version (building both for testing)
	wasm-ld  balls-wasm.o -o balls.wasm \
		--no-entry --allow-undefined  \
		--export=memory --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move

# twrWasmModuleAsync version (building both for testing)
	wasm-ld  balls-wasm.o -o balls-a.wasm \
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
	rm -f *.o
	rm -f *.bc
	rm -f *.wasm
	rm -r -f dist
	rm -r -f .parcel-cache
		