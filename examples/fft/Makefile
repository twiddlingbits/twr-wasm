
# tested with mingw32-make using windows

CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

default: fft-script.js kiss_fft.wasm

fft-script.js: index.html fft-script.ts
	tsc
	cp ../server.py dist

kiss_fft.o : kiss_fft.c kiss_fft.h _kiss_fft_guts.h 
	$(CC) $(CFLAGS)  $< -o $@

kiss_fft.wasm: kiss_fft.o 
	llvm-link -o kiss_fft.bc kiss_fft.o ../../lib-c/twr.a
	llc -filetype=obj kiss_fft.bc -o kiss_fft-wasm.o
	wasm-ld  kiss_fft-wasm.o -o kiss_fft.wasm \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=twr_malloc --export=twr_wasm_init \
		--export=kiss_fft_alloc --export=kiss_fft  --export=twr_free
	
clean:
	rm -f *.o
	rm -f *.bc
	rm -f fft-script.js
	rm -f *.wasm
	