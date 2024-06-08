# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O0 Optimization off
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols  (also good to use twrd.a -- debug twr.a lib -- and optimization off -- in this case)
# -v verbose
CFLAGS := -c -Wall -O3  $(TWRCFLAGS)

default: fft-script.js kiss_fft.wasm

fft-script.js: index.html fft-script.ts
	tsc

kiss_fft.o : kiss_fft.c kiss_fft.h _kiss_fft_guts.h 
	$(CC) $(CFLAGS)  $< -o $@

kiss_fft.wasm: kiss_fft.o 
	wasm-ld  kiss_fft.o ../../lib-c/twr.a -o kiss_fft.wasm \
		--no-entry --initial-memory=1048576 --max-memory=1048576 \
		--export=kiss_fft_alloc --export=kiss_fft
clean:
	rm -f *.o
	rm -f fft-script.js
	rm -f *.wasm
	rm -f *.map
		