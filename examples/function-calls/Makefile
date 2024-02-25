
# tested with mingw32-make using windows
# to run after executing make, from the shell cd dist and type 'python server.py', then load http://localhost:8000/ in your browser
# to build you will need to install npm, parcel, clang and you will need to 
# run shell command "npm install" from this folder containing package.json to install the dependent node_modules


TARGET := dist/index.html
CC := clang
CFLAGS := -cc1 -emit-llvm-bc -triple=wasm32-unknown-unknown-wasm -std=c17 -I ../../include 

PUBLIC_URL:= ./

$(info $(PUBLIC_URL))

default: $(TARGET)

# bundle using parcel
$(TARGET): index.html function-calls.wasm
	npm install
	parcel build --no-cache --no-optimize --public-url $(PUBLIC_URL) --dist-dir dist index.html async.html

function-calls.o: function-calls.c
	$(CC) $(CFLAGS)  $< -o $@

function-calls.wasm: function-calls.o 
# llvm-link takes several LLVM bitcode files and links them together into a single LLVM bitcode file.
	llvm-link -o function-calls.bc function-calls.o ../../lib-c/twr.a

# llc compiles LLVM source inputs into assembly language for a specified architecture. 
	llc -filetype=obj function-calls.bc -o function-calls-wasm.o

# wasm-ld takes WebAssembly binaries as inputs and produces a WebAssembly binary as its output. Mimics behaviour of the ELF lld. 
	wasm-ld  function-calls-wasm.o -o function-calls.wasm  --no-entry --allow-undefined \
			--export=memory --shared-memory --no-check-features --initial-memory=1048576 --max-memory=1048576 \
			--export=twr_malloc --export=twr_wasm_init --export=twr_wasm_print_mem_debug_stats \
			--export=function_calls --export=get_structu32 --export=get_structu8 \
	
	mkdir -p dist
	cp function-calls.wasm dist

# copy simple python test server that correctly sets CORS headers needed by SharedArrayBuffer
	 cp ../server.py dist

clean:
	rm -f *.o
	rm -f *.bc
	rm -f *.wasm
	rm -f dist/*
	rm -f .parcel-cache/*
	