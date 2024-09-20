CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CPPLIB := ../twr-cpp
CFLAGS := -c -Wall -O3 $(TWRCFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS) -I $(CPPLIB)



.PHONY: default

default: tests-audio.wasm tests-audio-a.wasm clearIODiv.js

clearIODiv.js: index.html clearIODiv.ts
	tsc

tests-audio.o: tests-audio.c
	$(CC) $(CFLAGS)  $< -o $@

tests-audio-a.o: tests-audio.c
	$(CC) $(CFLAGS)  $< -o $@ -DASYNC

tests-audio.wasm: tests-audio.o
	wasm-ld  tests-audio.o ../../lib-c/twr.a -o tests-audio.wasm \
		--no-entry --initial-memory=4063232 --max-memory=4063232 \

tests-audio-a.wasm: tests-audio-a.o
	wasm-ld tests-audio-a.o ../../lib-c/twr.a -o tests-audio-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=4063232 --max-memory=4063232 \

clean:
	rm -f *.o
	rm -f *.wasm