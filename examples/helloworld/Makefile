
TARGET = helloworld.wasm
CC = clang

CFLAGS = -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17  \
	-I ../../../lib-twr/std-crt-include \
	-iquote ../../../lib-twr/twr-crt \
	-iquote ../lib-twr/twr-wasm-api-c \

default: $(TARGET)

../../../lib-twr/twr.o: FORCE
	cd ../lib-twr && $(MAKE)

FORCE:

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

$(TARGET): helloworld.o
	llvm-link -o hello-wasm.bc helloworld.o ../../../lib-twr/twr.a
	llc -filetype=obj hello-wasm.bc -o hello-wasm.o
	wasm-ld hello-wasm.o -o $(TARGET)  --no-entry --allow-undefined  --import-memory --export=hello --export=twr_wasm_malloc --export=twr_wasm_init
