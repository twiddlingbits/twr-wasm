
# tested with mingw32-make using windows

OBJ := tests-user.o parsecmd.o terminal.o

# -nostdinc Disable standard #include directories, (std includes provided by twr-wasm)
# -nostdlib Disable standard c library, (use twr.a or twrd.a provided by twr-wasm)
# -nostdlibinc tells the compiler to not search the standard system directories or compiler builtin directories for include files, For C++
# -fno-exceptions Don't generate stack exception code since libc++ and libcxxabi built without exceptions, for C++
# -fno-rtti disables runtime info overhead
TWRCFLAGS := --target=wasm32 -fno-exceptions -fno-rtti -nostdlibinc -nostdinc -nostdlib -I  ../../include/c++/v1 -I ../../include -D_LIBCPP_PROVIDES_DEFAULT_RUNE_TABLE

# -O0 Optimization off (default if no -O specified)
# -O3 Optimization level 3
# -Wall Warn all
# -c compile w/o linking
# -g for debug symbols
# -v verbose
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))
OBJ := $(patsubst %, $(OBJOUTDIR)/%, $(OBJ))
$(info $(OBJ))

.PHONY: default clean

default: tests-user.wasm

$(OBJOUTDIR)/%.o: %.cpp parsecmd.h terminal.h
	clang $(CFLAGS_DEBUG)  $< -o $@

tests-user.wasm: $(OBJ)
	wasm-ld  $(OBJ) ../../lib-c/twrd.a ../../lib-c/libc++.a -o tests-user.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=262144 --max-memory=262144  \
		--export=tests_user

clean:
	rm -f *.wasm
	rm -r -f $(OBJOUTDIR)

		