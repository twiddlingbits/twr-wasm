
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by twr-wasm
# -nostdlib Disable standard c library, provided by twr-wasm
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -O0 Optimization off (default if no -O specified)
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols  (also good to use twrd.a -- debug twr.a lib -- and optimization off -- in this case)
# -v verbose
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: both

both: tests.wasm tests-dbg.wasm 

tests.o: tests.c
	$(CC) $(CFLAGS)  $< -o $@

tests-dbg.o: tests.c
	$(CC) $(CFLAGS_DEBUG)  $< -o $@

tests.wasm: tests.o 
	wasm-ld tests.o ../../lib-c/twr.a -o tests.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=tests --export=sin_test

tests-dbg.wasm: tests-dbg.o 
	wasm-ld tests.o ../../lib-c/twrd.a -o tests-dbg.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=tests --export=sin_test

clean:
	rm -f *.o
	rm -f *.wasm

	