CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CPPLIB := ../twr-cpp
CFLAGS := -c -Wall -O3 $(TWRCFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS) -I $(CPPLIB)



.PHONY: default

default: tests-d2d.wasm tests-d2d-a.wasm

tests-d2d.o: tests-d2d.c
	$(CC) $(CFLAGS)  $< -o $@

tests-d2d-a.o: tests-d2d.c
	$(CC) $(CFLAGS)  $< -o $@ -DASYNC

tests-d2d.wasm: tests-d2d.o
	wasm-ld  tests-d2d.o ../../lib-c/twr.a -o tests-d2d.wasm \
		--no-entry --initial-memory=4063232 --max-memory=4063232 \
		--export=test_all --export=test_specific --export get_num_tests --export get_test_name

tests-d2d-a.wasm: tests-d2d-a.o
	wasm-ld tests-d2d-a.o ../../lib-c/twr.a -o tests-d2d-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=4063232 --max-memory=4063232 \
		--export=test_all --export=test_specific --export get_num_tests --export get_test_name

clean:
	rm -f *.o
	rm -f *.wasm