
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

wasm: multi-io.wasm multi-io-mod.wasm

multi-io.o: multi-io.c
	$(CC) $(CFLAGS_DEBUG)  $< -o $@

multi-io-mod.o: multi-io-mod.c
	$(CC) $(CFLAGS_DEBUG)  $< -o $@

multi-io.wasm: multi-io.o 
	wasm-ld multi-io.o ../../lib-c/twrd.a -o multi-io.wasm  \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=multi

multi-io-mod.wasm: multi-io-mod.o 
	wasm-ld multi-io-mod.o ../../lib-c/twrd.a -o multi-io-mod.wasm  \
		--no-entry --initial-memory=1048576 --max-memory=1048576 \
		--export=multi
	
clean:
	rm -f *.o
	rm -f *.wasm
	