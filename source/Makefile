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
CC := clang

INCOUTDIR:= ../include
$(info $(shell mkdir -p $(INCOUTDIR)))


# -nostdinc Disable standard #include directories, provided by tiny-wasm-runtime
# -nostdlib Disable standard c library, provided by tiny-wasm-runtime
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, c++ only?
# -fno-exceptions Don't generate stack exception code since we don't use std:: exception handling
#TWRCFLAGS := --target=wasm32 -fno-exceptions -nostdinc -nostdlib -isystem  ../include

# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
#CFLAGS := -c -Wall -O3  $(TWRCFLAGS)
# above doesnt work with ar, and link-ar with above doesn't export

CFLAGS = -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -O3 -I $(INCOUTDIR)


.PHONY: clean all javascript
all: $(TWRA) libjs

# build typescript files
libjs:
	@mkdir -p $(LIBJSOUTDIR)
	tsc -p twr-wasm-ts/tsconfig.json
	cp -f whatkey/whatkey.js $(LIBJSOUTDIR)/whatkey.js

# put all objects into a single directory; assumes unqiue filenames
OBJECTS :=  \
	$(patsubst twr-crt/%.c, %.o, $(wildcard twr-crt/*.c))\
	$(patsubst compiler-rt/%.c, %.o, $(wildcard compiler-rt/*.c))\
	$(patsubst twr-wasm-c/%.c, %.o, $(wildcard twr-wasm-c/*.c))

OBJECTS := $(patsubst %, $(OBJOUTDIR)/%, $(OBJECTS))
#$(info $(OBJECTS))

HEADERS := \
		$(patsubst stdlib-include/%.h, %.h, $(wildcard stdlib-include/*.h)) \
		$(patsubst twr-crt/%.h, %.h, $(wildcard twr-crt/*.h)) \
		twr-wasm.h \
		twr-draw2d.h

HEADERS := $(patsubst %, $(INCOUTDIR)/%, $(HEADERS))
#$(info $(HEADERS))

# consolidate all headers into the include folder
$(INCOUTDIR)/%.h: */%.h
	cp -f $< $@

$(OBJOUTDIR)/%.o: */%.c $(HEADERS)
	$(CC) $(CFLAGS)  $< -o $@

$(TWRA): $(OBJECTS)
#	llvm-ar crsv $(TWRA) $(OBJECTS)  -- almost works with the "gcc" style CC, but requires -export for twr.a exports in all app wasm-ld
	llvm-ar cr $(OBJOUTDIR)/twr-a0.bc $(OBJECTS)
	llvm-link -o $(OBJOUTDIR)/twr-a.bc $(OBJOUTDIR)/twr-a0.bc
	llc -filetype=obj $(OBJOUTDIR)/twr-a.bc -o $(TWRA)

clean:
	rm -f $(INCOUTDIR)/*
	rm -f $(OBJOUTDIR)/*
	rm -f $(LIBJSOUTDIR)/*
	rm -f $(TWRA)

# I found these comands useful to look at symbols
# llc -filetype=asm twr-wasm.bc -o twr-wasm.asm
# other good tools: wasm-decompile, wasm-validate, llvm-objdump -S
# and wasm2wat file.wasm -o aw.asm

# I was also able to compile with below options:
# CFLAGS =  --target=wasm32-unknown-unknown-wasm -std=c17 -g -Wall -c -v \
# and the only link line being:
# wasm-ld $(OBJECTS) -o $(OBJOUTDIR)/awbasic.wasm  --no-entry --allow-undefined  --import-memory --export=run_basic_file --export=twr_wasm_malloc --export=twr_wasm_init

