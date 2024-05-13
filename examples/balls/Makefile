
# tested with mingw32-make using windows

OBJ := gamefield.o ball.o canvas.o heart.o newop.o

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ 
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling, c++
# -fno-rtti since libc++ built without runtime type info, for C++
TWRCFLAGS := --target=wasm32 -fno-exceptions -fno-rtti -nostdlibinc -nostdinc -nostdlib -isystem  ../../include

# -O0 Optimization off
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -g $(TWRCFLAGS)

OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))
OBJ := $(patsubst %, $(OBJOUTDIR)/%, $(OBJ))
$(info $(OBJ))

default: balls.wasm

$(OBJOUTDIR)/%.o: %.cpp
	clang $(CFLAGS)  $< -o $@

balls.wasm: $(OBJ)
# twrWasmModule version (building both for testing)
	wasm-ld  $(OBJ) ../../lib-c/twrd.a -o balls.wasm \
		--no-entry --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move
		
# twrWasmModuleAsync version (building both for testing)
	wasm-ld  $(OBJ) ../../lib-c/twrd.a -o balls-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move 


clean:
	rm -f *.wasm
	rm -r -f $(OBJOUTDIR)

		