CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CPPLIB := ../../source/twr-cpp
CFLAGS := -c -Wall -O3 $(TWRCFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS) -I $(CPPLIB)



.PHONY: default

default: pong.wasm

pong.o: pong.cpp $(CPPLIB)/canvas.h
	$(CC) $(CFLAGS)  $< -o $@

canvas.o: $(CPPLIB)/canvas.cpp $(CPPLIB)/canvas.h
	$(CC) $(CFLAGS)  $< -o $@

pong.wasm: pong.o canvas.o
	wasm-ld  pong.o canvas.o ../../lib-c/twr.a -o pong.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=render --export=tick --export=keyEvent

run: default
	cd ..
	./server.py

clean:
	rm -f *.o
	rm -f *.wasm