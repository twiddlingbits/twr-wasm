CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: default

default: pong.wasm

pong.o: pong.cpp
	$(CC) $(CFLAGS)  $< -o $@

canvas.o: canvas.cpp canvas.h
	$(CC) $(CFLAGS)  $< -o $@

pong.wasm: pong.o canvas.o
	wasm-ld  pong.o canvas.o ../../lib-c/twr.a -o pong.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=render --export=tick --export=keyEvent

run: default
	cd ..
	./server.py

clean:
	rm *.o
	rm *.wasm