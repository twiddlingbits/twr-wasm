
# tested with mingw32-make using windows


CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

.PHONY: wasm bundle

wasm: function-calls.wasm

function-calls.o: function-calls.c
	$(CC) $(CFLAGS)  $< -o $@

function-calls.wasm: function-calls.o 
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o function-calls.bc function-calls.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj function-calls.bc -o function-calls-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  function-calls-wasm.o -o function-calls.wasm  \
		--no-entry --allow-undefined  \
		--export=memory --initial-memory=1048576 --max-memory=1048576 \
		--export=twr_malloc --export=twr_free --export=twr_wasm_init \
		--export=function_calls --export=get_structu32 --export=get_structu8 --export=twr_wasm_print_mem_debug_stats

# twrWasmModuleAsync uses shared memory
	wasm-ld  function-calls-wasm.o -o function-calls-a.wasm  \
		--no-entry --allow-undefined  \
		--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
		--export=twr_malloc --export=twr_free --export=twr_wasm_init \
		--export=function_calls --export=get_structu32 --export=get_structu8 --export=twr_wasm_print_mem_debug_stats
	
# bundle using parcel v2
PUBLIC_URL:= ./
bundle: wasm
	parcel build --no-cache --public-url $(PUBLIC_URL) --dist-dir dist index.html async.html
	cp function-calls.wasm dist
	cp function-calls-a.wasm dist
	cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.wasm
	rm -f -r dist
	rm -f -r .parcel-cache
	