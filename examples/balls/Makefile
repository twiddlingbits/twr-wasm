
# tested with mingw32-make using windows

# -nostdinc Disable standard #include directories, provided by twr-wasm
# -nostdlib Disable standard c library, provided by twr-wasm
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ 
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling, c++
# -fno-rtti disables runtime type overhead
TWRCPPFLAGS := --target=wasm32 -fno-exceptions -fno-rtti -nostdlibinc -nostdinc -nostdlib -isystem  ../../include

# -O0 Optimization off
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CPPLIB := ../twr-cpp
CFLAGS := -c -Wall -O3 -DNDEBUG  $(TWRCPPFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCPPFLAGS) -I $(CPPLIB)

OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))

HEADERS := gamefield.h  ball.h $(CPPLIB)/canvas.h

# put all objects into a single directory; assumes unqiue filenames
OBJECTS_RAW := gamefield.o ball.o  heart.o newop.o canvas.o
OBJECTS := $(patsubst %, $(OBJOUTDIR)/%, $(OBJECTS_RAW))
OBJECTS_DEBUG := $(patsubst %, $(OBJOUTDIR)/dbg-%, $(OBJECTS_RAW))
#$(info $(OBJECTS))

default: balls.wasm balls-dbg.wasm balls-a.wasm

$(OBJOUTDIR)/canvas.o: $(CPPLIB)/canvas.cpp $(CPPLIB)/canvas.h
	clang $(CFLAGS)  $< -o $@

$(OBJOUTDIR)/%.o: %.cpp $(HEADERS)
	clang $(CFLAGS)  $< -o $@


$(OBJOUTDIR)/dbg-canvas.o: $(CPPLIB)/canvas.cpp $(CPPLIB)/canvas.h
	clang $(CFLAGS_DEBUG)  $< -o $@

$(OBJOUTDIR)/dbg-%.o: %.cpp $(HEADERS)
	clang $(CFLAGS_DEBUG)  $< -o $@


# twrWasmModule release version
balls.wasm: $(OBJECTS)
	wasm-ld $(OBJECTS) ../../lib-c/twr.a -o balls.wasm \
		--no-entry --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move

# twrWasmModule debug version
balls-dbg.wasm: $(OBJECTS_DEBUG)
	wasm-ld $(OBJECTS_DEBUG) ../../lib-c/twrd.a -o balls-dbg.wasm \
		--no-entry --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move

# twrWasmModuleAsync release version
balls-a.wasm: $(OBJECTS)	
	wasm-ld $(OBJECTS) ../../lib-c/twr.a -o balls-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576  \
		--export=bounce_balls_init --export=bounce_balls_move 

clean:
	rm -f *.wasm
	rm -r -f $(OBJOUTDIR)

		