CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CPPLIB := ../twr-cpp
CFLAGS := -c -Wall -O3 $(TWRCFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS) -I $(CPPLIB)

$(info $(shell mkdir -p out))

.PHONY: default

default: window.wasm window-a.wasm

window.o: window.c
	$(CC) $(CFLAGS)  $< -o $@

window-a.o: window.c
	$(CC) $(CFLAGS)  $< -o $@ -DASYNC

window.wasm: window.o
	wasm-ld  window.o ../../lib-c/twr.a -o window.wasm \
		--no-entry --initial-memory=4063232 --max-memory=4063232 \

window-a.wasm: window-a.o
	wasm-ld window-a.o ../../lib-c/twr.a -o window-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=4063232 --max-memory=4063232 \

clean:
	rm -f *.o
	rm -f *.wasm
	rm -f out/*