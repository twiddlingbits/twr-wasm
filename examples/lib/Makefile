
# tested with mingw32-make using windows

CC := clang

# -nostdinc Disable standard #include directories, provided by twr-wasm
# -nostdlib Disable standard c library, provided by twr-wasm
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, For C++
# -fno-exceptions Don't generate stack exception code since libc++ and libcxxabi built without exceptions (and abi required for exceptions), C++
# -fno-rtti since libc++ built without runtime type info, C++
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include

# -c compile w/o linking
# -Wall Warn all
# -O3 Optimization level 3
# -O0 Optimizatons off
# -g embed debug info
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

$(info $(shell mkdir -p out))

.PHONY: pre-build default

default: pre-build twrlibex.js testex.wasm testex-a.wasm

pre-build:
	@if [ -d "../../source/" ]; then \
		$(MAKE) -C ../../source/; \
	else \
		echo "Source Directory does not exist. Skipping source build step."; \
	fi

twrlibex.js: index.html twrlibex.ts
	tsc

out/testex.o: testex.c twr-ex.h
	$(CC) $(CFLAGS_DEBUG)  $< -o $@
# use CFLAGS_DEBUG to build with debug symbols

testex.wasm: out/testex.o 
	wasm-ld  out/testex.o ../../lib-c/twrd.a -o testex.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 

testex-a.wasm: out/testex.o 
	wasm-ld  out/testex.o ../../lib-c/twrd.a -o testex-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 

clean:
	rm -f *.wasm
	rm -f out/*

	