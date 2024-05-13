# This makefile uses clang to compile all the twr C files into wasm object bytecode, and
# then links all these compiled files into a single twr.a lib (of wasm bytecode)
# twr.a can be linked to your wasm project, which should also be built using clang
# this makefile also builds the include directory by copying the various includes in other folders
# this makefile also builds the wasm API Typescript files using tsc
#
# developed and tested with mingw32-make 
# should be compatible with any GNU make

# $(info $(SHELL))

# built typescript files go here
# keep synced with tsconfig.json
LIBJSOUTDIR := ../lib-js

# temp working .o files go here
OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR))) 

TWRA := ../lib-c/twr.a
TWRA_DEBUG := ../lib-c/twrd.a
CC := clang

INCOUTDIR:= ../include
$(info $(shell mkdir -p $(INCOUTDIR)))

# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling, c++
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem $(INCOUTDIR)

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3 -DNDEBUG $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0 $(TWRCFLAGS) 

.PHONY: clean all javascript
all: $(TWRA) $(TWRA_DEBUG) libjs

# build typescript files
libjs:
	@mkdir -p $(LIBJSOUTDIR)
	tsc -p twr-ts/tsconfig.json
	cp -f whatkey/whatkey.js $(LIBJSOUTDIR)/whatkey.js

# put all objects into a single directory; assumes unqiue filenames
OBJECTS_RAW :=  \
	$(patsubst twr-stdclib/%.c, %.o, $(wildcard twr-stdclib/*.c))\
	$(patsubst compiler-rt/%.c, %.o, $(wildcard compiler-rt/*.c))\
	$(patsubst twr-c/%.c, %.o, $(wildcard twr-c/*.c)) \

OBJECTS := $(patsubst %, $(OBJOUTDIR)/%, $(OBJECTS_RAW))
OBJECTS_DEBUG := $(patsubst %, $(OBJOUTDIR)/dbg-%, $(OBJECTS_RAW))
#$(info $(OBJECTS))

HEADERS := \
		$(patsubst twr-stdclib/include/%.h, %.h, $(wildcard twr-stdclib/include/*.h)) \
		$(patsubst twr-c/%.h, %.h, $(wildcard twr-c/*.h)) \

HEADERS := $(patsubst %, $(INCOUTDIR)/%, $(HEADERS))
#$(info $(HEADERS))

# consolidate all headers into the include folder
$(INCOUTDIR)/%.h: twr-c/%.h
	cp -f $< $@

$(INCOUTDIR)/%.h: twr-stdclib/include/%.h
	cp -f $< $@

$(OBJOUTDIR)/%.o: */%.c $(HEADERS)
	$(CC) $(CFLAGS)  $< -o $@

$(OBJOUTDIR)/dbg-%.o: */%.c $(HEADERS)
	$(CC) $(CFLAGS_DEBUG)  $< -o $@

$(OBJOUTDIR)/%.wasm: */%.wat
	wat2wasm $< -r -o $@

$(TWRA): $(OBJECTS) $(OBJOUTDIR)/memcpy.wasm $(OBJOUTDIR)/trap.wasm
	wasm-ld  $(OBJOUTDIR)/memcpy.wasm $(OBJOUTDIR)/trap.wasm $(OBJECTS) -o $(TWRA) --no-entry --no-gc-sections --relocatable

$(TWRA_DEBUG): $(OBJECTS_DEBUG) $(OBJOUTDIR)/memcpy.wasm $(OBJOUTDIR)/trap.wasm
	wasm-ld  $(OBJOUTDIR)/memcpy.wasm $(OBJOUTDIR)/trap.wasm $(OBJECTS_DEBUG) -o $(TWRA_DEBUG) --no-entry --no-gc-sections --relocatable

clean:
	rm -f $(INCOUTDIR)/*.h
	rm -f $(OBJOUTDIR)/*
	rm -f $(LIBJSOUTDIR)/*
	rm -f $(TWRA)
	rm -f $(TWRA_DEBUG)

# I found these comands useful to look at symbols
# llc -filetype=asm twr-wasm.bc -o twr-wasm.asm
# other good tools: wasm-decompile, wasm-validate, llvm-objdump -S
# and wasm2wat file.wasm -o aw.asm

# alt method when CFLAGS includes -emit-llvm
#	llvm-ar crsv $(TWRA) $(OBJECTS)  -- almost works with the "gcc" style CC, but requires -export for twr.a exports in all app wasm-ld
#	llvm-ar cr $(OBJOUTDIR)/twr-a0.bc $(OBJECTS)
#	llvm-link -o $(OBJOUTDIR)/twr-a.bc $(OBJOUTDIR)/twr-a0.bc
#	llc -filetype=obj $(OBJOUTDIR)/twr-a.bc -o $(OBJOUTDIR)/twr-a.wasm
#	wasm-ld  $(OBJOUTDIR)/memcpy.wasm $(OBJOUTDIR)/trap.wasm $(OBJOUTDIR)/twr-a.wasm -o $(TWRA) --no-entry --relocatable
