
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

wasm: divcon.wasm

divcon.o: divcon.c
	$(CC) $(CFLAGS_DEBUG)  $< -o $@

divcon.wasm: divcon.o 
	wasm-ld divcon.o ../../lib-c/twrd.a -o divcon.wasm  \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=demo_divcon 
	
clean:
	rm -f *.o
	rm -f *.wasm
	