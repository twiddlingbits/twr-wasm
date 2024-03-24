# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling
TWRCFLAGS := --target=wasm32 -fno-exceptions -nostdinc -nostdlib -isystem  ../../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3  $(TWRCFLAGS)

default: fft-script.js kiss_fft.wasm

fft-script.js: index.html fft-script.ts
	tsc

kiss_fft.o : kiss_fft.c kiss_fft.h _kiss_fft_guts.h 
	$(CC) $(CFLAGS)  $< -o $@

kiss_fft.wasm: kiss_fft.o 
	wasm-ld  kiss_fft.o ../../lib-c/twr.a -o kiss_fft.wasm \
		--no-entry --allow-undefined  \
		--export=memory --initial-memory=1048576 --max-memory=1048576 \
		--export=kiss_fft_alloc --export=kiss_fft  --export=twr_free
	
bundle: default
	parcel build --no-cache --dist-dir dist index.html 
	cp kiss_fft.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f fft-script.js
	rm -f *.wasm
	rm -r -f dist
	rm -r -f .parcel-cache
		