CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ../../include
CPPLIB := ../twr-cpp
CFLAGS := -c -Wall -O3 $(TWRCFLAGS) -I $(CPPLIB)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS) -I $(CPPLIB)

OBJOUTDIR := out
$(info $(shell mkdir -p $(OBJOUTDIR)))

HEADERS := pong-menu.h $(CPPLIB)/canvas.h pong.h

# put all objects into a single directory; assumes unqiue filenames
OBJECTS_RAW := pong-menu.o canvas.o entry-point.o pong.o
OBJECTS := $(patsubst %, $(OBJOUTDIR)/%, $(OBJECTS_RAW))
OBJECTS_ASYNC := $(patsubst %, $(OBJOUTDIR)/async-%, $(OBJECTS_RAW))

.PHONY: default

default: jsEventsLib.js entry-point.wasm entry-point-a.wasm

$(OBJOUTDIR)/canvas.o: $(CPPLIB)/canvas.cpp $(CPPLIB)/canvas.h
	clang $(CFLAGS)  $< -o $@

$(OBJOUTDIR)/%.o: %.cpp $(HEADERS)
	clang $(CFLAGS)  $< -o $@


$(OBJOUTDIR)/async-canvas.o: $(CPPLIB)/canvas.cpp $(CPPLIB)/canvas.h
	clang $(CFLAGS)  $< -o $@ -DASYNC

$(OBJOUTDIR)/async-%.o: %.cpp $(HEADERS)
	clang $(CFLAGS)  $< -o $@ -DASYNC

jsEventsLib.js: jsEventsLib.ts
	tsc

entry-point.wasm: $(OBJECTS)
	wasm-ld $(OBJECTS) ../../lib-c/twr.a -o entry-point.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=2031616 --max-memory=2031616

entry-point-a.wasm: $(OBJECTS_ASYNC)
	wasm-ld $(OBJECTS_ASYNC) ../../lib-c/twr.a -o entry-point-a.wasm \
		--no-entry --shared-memory --no-check-features --initial-memory=2031616 --max-memory=2031616
	
run: default
	cd ..
	./server.py

clean:
	rm -f *.o
	rm -f *.wasm
	rm -f out/*.o