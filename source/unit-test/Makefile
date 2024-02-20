# This makefile builds the unit tests for twr-crt with gcc
# The output is out/test.exe, which can be executed to execute all the twr-crt unit tests + twr-bigint unit tests.
# Unit tests for included external code (math, comipler-rt) are not executed (and don't exist in this repo).
# twr-wasm-c is also not tested with these unit tests.
# This Makefile was tested on windows, but should work on any platfrom.  You might need to change the TARGETFILE name away from .exe
# Tested using mingw32-make 


OUTDIR = out
TARGETFILE = test.exe
TARGET = $(OUTDIR)/$(TARGETFILE)

LIBS = 
CC = gcc

# -g emig debug info
# -Wall enable every warning
# -fdiagnostics-color=always  use color in diagnostics
CFLAGS = -g -Wall -Wextra -fdiagnostics-color=always -std=c17 -pedantic -iquote ../twr-bigint/ -iquote ../twr-crt/

.PHONY: default clean

default: $(TARGET)

OBJECTS = $(patsubst ../twr-crt/%.c, $(OUTDIR)/%.o, $(wildcard ../twr-crt/*.c)) \
	$(patsubst ../twr-crt/float/%.c, $(OUTDIR)/%.o, $(wildcard ../twr-crt/float/*.c)) \
	$(OUTDIR)/twr-bigint.o \
	$(OUTDIR)/main.o
HEADERS = $(wildcard ../*.h)   ../twr-crt/twr-crt.h ../twr-crt/float/twr-float-util.h ../twr-bigint/twr-bigint.h

$(OUTDIR)/%.o: ../twr-crt/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/%.o: ../twr-crt/float/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/%.o: ../twr-bigint/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/main.o: main.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

.PRECIOUS: $(TARGET) $(OBJECTS)

$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) -Wall $(LIBS) -o $@

clean:
	rm -f $(OUTDIR)/*
	rm -f $(OUTDIR)/$(TARGETFILE)

