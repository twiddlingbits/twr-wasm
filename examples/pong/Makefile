CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CPPLIB := ../twr-cpp
CFLAGS := -c -Wall -O3 $(TWRCFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS) -I $(CPPLIB)



.PHONY: default

default: pong.wasm pong-a.wasm

pong.o: pong.cpp $(CPPLIB)/canvas.h
	$(CC) $(CFLAGS)  $< -o $@

pong-a.o: pong.cpp $(CPPLIB)/canvas.h
	$(CC) $(CFLAGS)  $< -o $@ -DASYNC

canvas.o: $(CPPLIB)/canvas.cpp $(CPPLIB)/canvas.h
	$(CC) $(CFLAGS)  $< -o $@

pong.wasm: pong.o canvas.o
	wasm-ld  pong.o canvas.o ../../lib-c/twr.a -o pong.wasm \
		--no-entry --initial-memory=2031616 --max-memory=2031616 \
		--export=render --export=tick --export=keyEvent

pong-a.wasm: pong-a.o canvas.o
	wasm-ld pong-a.o canvas.o ../../lib-c/twr.a -o pong-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=2031616 --max-memory=2031616 \
		--export=render --export=tick --export=keyEvent

run: default
	cd ..
	./server.py

clean:
	rm -f *.o
	rm -f *.wasm