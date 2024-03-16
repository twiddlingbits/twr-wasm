
# tested with mingw32-make using windows

CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm  -I ../../include 

default: balls.wasm

balls.o : balls.cpp
	$(CC) $(CFLAGS)  $< -o $@

canvas.o : canvas.cpp
	$(CC) $(CFLAGS)  $< -o $@

balls.wasm: balls.o canvas.o
	llvm-link -o balls.bc balls.o canvas.o ../../lib-c/twr.a
	llc -filetype=obj balls.bc -o balls-wasm.o
	wasm-ld  balls-wasm.o -o balls.wasm \
		--no-entry --allow-undefined  \
		--export=memory --initial-memory=1048576 --max-memory=1048576  \
		--export=twr_malloc --export=twr_free --export=twr_wasm_init \
		--export=bounce_balls_init --export=bounce_balls_move --export=twr_free

	wasm-ld  balls-wasm.o -o balls-a.wasm \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move --export=twr_free

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
		