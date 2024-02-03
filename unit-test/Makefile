# mingw32-make 

OUTDIR = out
TARGETFILE = test.exe
TARGET = $(OUTDIR)/$(TARGETFILE)


# -static use static rutime lib
LIBS = -lm

CC = gcc

# -g emig debug info
# -Wall enable every warning
# -fdiagnostics-color=always  use color in diagnostics
CFLAGS = -g -Wall -Wextra -fdiagnostics-color=always -std=c17 -pedantic -iquote ../twr-bigint/ -iquote ../twr-crt/

# add this to use twr stdcrt
# -iquote ../lib-twr/std-crt-include/ -isystem ../lib-twr/std-crt-include/

.PHONY: default all clean

default: $(TARGET)
all: default

OBJECTS = $(patsubst ../twr-crt/%.c, $(OUTDIR)/%.o, $(wildcard ../twr-crt/*.c)) \
	$(patsubst ../twr-crt/float/%.c, $(OUTDIR)/%.o, $(wildcard ../twr-crt/float/*.c)) \
	$(OUTDIR)/twr-bigint.o \
	$(OUTDIR)/main.o
HEADERS = $(wildcard ../*.h)  ../twr-crt/twr-crt.h ../twr-crt/float/float.h ../twr-bigint/twr-bigint.h

$(OUTDIR)/%.o: ../twr-crt/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/%.o: ../twr-crt/float/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/%.o: ../twr-bigint/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/%.o: ../math/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(OUTDIR)/main.o: main.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

.PRECIOUS: $(TARGET) $(OBJECTS)

$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) -Wall $(LIBS) -o $@

# Below only works on Windows
clean:
	del $(OUTDIR)\*.o
	del $(OUTDIR)\$(TARGETFILE)

