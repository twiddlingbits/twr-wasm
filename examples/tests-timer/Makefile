
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

.PHONY: all

all: tests-timer.wasm tests-timer-a.wasm

tests-timer.o: tests-timer.c
	$(CC) $(CFLAGS)  $< -o $@

tests-timer.wasm: tests-timer.o 
	wasm-ld tests-timer.o ../../lib-c/twr.a -o tests-timer.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=tests_timer

tests-timer-a.wasm: tests-timer.o 
	wasm-ld tests-timer.o ../../lib-c/twr.a -o tests-timer-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=131072 --max-memory=131072  \
		--export=tests_timer

clean:
	rm -f *.o
	rm -f *.wasm

	