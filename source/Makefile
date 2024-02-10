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
LIBJS := ../lib-js


# temp working .o files go here
OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))

TARGET := ../lib-c/twr.a
CC := clang

INCOUTDIR:= ../include
$(info $(shell mkdir -p $(INCOUTDIR)))


# -I add to include search path
# -iquote add to *quoted* search path
# -c Compile or assemble the source files, but do not link
# -Wpedantic Issue all the warnings demanded by strict ISO C and ISO C++
# -cc1 turns off gcc flag emulation

CFLAGS = -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I $(INCOUTDIR)

.PHONY: clean all
all: $(TARGET) $(LIBJS)/twrmod.js

# build typescript files
$(LIBJS)/twrmod.js: twr-wasm-api-ts/*.ts
	@mkdir -p $(LIBJS)
	tsc -p twr-wasm-api-ts/tsconfig.json

# put all objects into a single directory; assumes unqiue filenames
OBJECTS :=  \
	$(patsubst twr-crt/%.c, %.o, $(wildcard twr-crt/*.c))\
	$(patsubst twr-crt/float/%.c, %.o, $(wildcard twr-crt/float/*.c))\
	twr-bigint.o \
	$(patsubst math/%.c, %.o, $(wildcard math/*.c))\
	$(patsubst compiler-rt/%.c, %.o, $(wildcard compiler-rt/*.c))\
	$(patsubst twr-wasm-api-c/%.c, %.o, $(wildcard twr-wasm-api-c/*.c))

OBJECTS := $(patsubst %, $(OBJOUTDIR)/%, $(OBJECTS))
#$(info $(OBJECTS))

HEADERS := \
		$(patsubst stdlib-include/%.h, %.h, $(wildcard stdlib-include/*.h)) \
		$(patsubst twr-crt/%.h, %.h, $(wildcard twr-crt/*.h)) \
		s21_math.h \
		twr-bigint.h \
		twr-wasm.h 

HEADERS := $(patsubst %, $(INCOUTDIR)/%, $(HEADERS))
#$(info $(HEADERS))


# consolidate all headers into the include folder
$(INCOUTDIR)/%.h: */%.h
	cp -f $< $@

$(OBJOUTDIR)/%.o: */%.c $(HEADERS)
	$(CC) $(CFLAGS)  $< -o $@

$(OBJOUTDIR)/%.o: */*/%.c $(HEADERS)
	$(CC) $(CFLAGS)  $< -o $@
	
$(TARGET): $(OBJECTS)
	ar r $(TARGET) $(OBJECTS)
#	llvm-link -o $(OBJOUTDIR)/twr-wasm.bc $(OBJECTS)
#	llc -filetype=obj $(OBJOUTDIR)/twr-wasm.bc -o $(TARGET)

clean:
	rm -f $(INCOUTDIR)/*
	rm -f $(OBJOUTDIR)/*
	rm -f $(LIBJS)/*
	rm -f $(TARGET)

# I found these comands useful to look at symbols
# llc -filetype=asm twr-wasm.bc -o twr-wasm.asm
# other good tools: wasm-decompile, wasm-validate, llvm-objdump -S
# and wasm2wat file.wasm -o aw.asm

# I was also able to compile with below options:
# CFLAGS =  --target=wasm32-unknown-unknown-wasm -std=c17 -g -Wall -c -v \
# and the only link line being:
# wasm-ld $(OBJECTS) -o $(OBJOUTDIR)/awbasic.wasm  --no-entry --allow-undefined  --import-memory --export=run_basic_file --export=twr_wasm_malloc --export=twr_wasm_init

