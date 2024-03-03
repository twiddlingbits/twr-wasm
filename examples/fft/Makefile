
# default target builds TypeScript and C.  Can be executed with Chrome from local filesystem (with flags, see ReadMe)
# bundle target creates a bundle in dist folder that can be executed http://localhost:8000 with python server.py 
# default target should be built before bulding bundle target
# tested with mingw32-make using windows

CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

default: fft-script.js kiss_fft.wasm

fft-script.js: index.html fft-script.ts
	tsc

kiss_fft.o : kiss_fft.c kiss_fft.h _kiss_fft_guts.h 
	$(CC) $(CFLAGS)  $< -o $@

kiss_fft.wasm: kiss_fft.o 
	llvm-link -o kiss_fft.bc kiss_fft.o ../../lib-c/twr.a
	llc -filetype=obj kiss_fft.bc -o kiss_fft-wasm.o
	wasm-ld  kiss_fft-wasm.o -o kiss_fft.wasm \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=twr_malloc --export=twr_free --export=twr_wasm_init \
		--export=kiss_fft_alloc --export=kiss_fft  --export=twr_free
	
bundle: default
	parcel build --no-cache --dist-dir dist index.html 
	cp kiss_fft.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f fft-script.js
	rm -f *.wasm
	rm -r -f dist
	rm -r -f .parcel-cache
		