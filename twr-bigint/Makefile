# developed for mingw32-make

OUTDIR = out

# -static use static rutime lib
LIBS = -lm

CC = gcc

# -g emig debug info
# -Wall enable every warning
# -fdiagnostics-color=always  use color in diagnostics
CFLAGS = -g -Wall -Wextra -fdiagnostics-color=always -std=c99 -pedantic

.PHONY: default all clean

default: $(OUTDIR)/test.exe $(OUTDIR)/factorial.exe
all: default

TESTOBJECTS = $(OUTDIR)/test.o $(OUTDIR)/twr-bigint.o 
FACTORIALOBJECTS = $(OUTDIR)/factorial.o $(OUTDIR)/twr-bigint.o 
HEADERS = twr-bigint.h

$(OUTDIR)/%.o: %.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/test.exe: $(TESTOBJECTS)
	$(CC) $(TESTOBJECTS) -Wall $(LIBS) -o $@

$(OUTDIR)/factorial.exe: $(FACTORIALOBJECTS)
	$(CC) $(FACTORIALOBJECTS) -Wall $(LIBS) -o $@

# Below only works on Windows
clean:
	del $(OUTDIR)\*.o
	del $(OUTDIR)\test.exe
	del $(OUTDIR)\factorial.exe