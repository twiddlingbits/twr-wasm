# Getting Started
## Installation
~~~
 git clone https://github.com/twiddlingbits/tiny-wasm-runtime
~~~
or
~~~
   npm install tiny-wasm-runtime
~~~

- `git clone` will copy the built libraries (lib-js, lib-c) as well as the source, examples, docs and VS Code settings.
- `npm install` will copy the minimum necessary to build your software: built libraries (lib-js, lib-c) and the examples.

Either will work.

**Installs for your C/C++ code**

  To build C/C++ code for use in your wasm project, you will need to install clang and the wasm-ld linker.  If you are using Windows, more details can be found at [the end of the Building Source section.](building.md)

## Creating Your First Web Assembly Program
You can find all of the code for this section in the folder [`examples\helloworld`](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/helloworld).

### step 1: Create the C code
Create a file `helloworld.c`
~~~
#include <stdio.h>

void hello() {
    printf("hello world\n");
}
~~~

### step 2: create the HTML
Create a file `index.html`
~~~
<!doctype html>
<html>
<head>
	<title>Hello World</title>

	<script type="importmap">
	{
		"imports": {
		"tiny-wasm-runtime": "../../lib-js/index.js",
		"whatkey": "../../lib-js/whatkey.js"
		}
	}
	</script>

</head>
<body>
	<div id="twr_iodiv"></div>

	<script type="module">
		import {twrWasmModule} from "tiny-wasm-runtime";
		
		const mod = new twrWasmModule();
		await mod.loadWasm("./helloworld.wasm");
		await mod.callC(["hello"]);
	</script>
</body>
</html>
~~~

The two relative paths in the importmap section need to be updated to point to the location where you installed `tiny-wasm-runtime/lib-js`.  The paths above are correct if your file is in an `example` subfolder.

### step 3: compile your C code to create your .wasm file
~~~
clang --target=wasm32 -fno-exceptions -nostdinc -nostdlib -isystem  -c -Wall ../../include helloworld.c -o helloworld.o
wasm-ld  helloworld.o ../../lib-c/twr.a -o helloworld.wasm  --no-entry 	--initial-memory=131072 --max-memory=131072 --export=hello 
~~~

The path to `twa.a` and to `include`  may need to be updated.  The above path is correct if your code is in an `example` subfolder.

### step 4: run your program
The two easiest ways to run your `index.html` web page locally are:
#### VS Code launch.json
Add an entry similar to this to your `launch.json`.  Adjust the `file` and `cwd` lines to be correct for your project.
~~~
        {
            "name": "hello",
            "type": "chrome",
            "request": "launch",
            "runtimeArgs": [
                "--allow-file-access-from-files",
                "--autoplay-policy=no-user-gesture-required",
                "--enable-features=SharedArrayBuffer"
            ],
            "file": "${workspaceFolder}/examples/index.html",
            "cwd": "${workspaceFolder}/examples/"
        }
~~~
#### Run a local web Server
Alternately, you can run a local server.  `python server.py` will work if you copy the `server.py` file from the examples folder to your project folder.

### See live version
Here is a link to the helloworld function running: [https://twiddlingbits.dev/examples/helloworld/index.html](https://twiddlingbits.dev/examples/helloworld/index.html)

## Next steps after hello world
A good way to get your own code up and running is to copy one of the `tiny-wasm-runtime/examples`, get it to build and run, then start modifying it.  

The example makefiles proved a more practical way to configure clang and wasm-ld (the linker).

Hello World uses the tiny-wasm-runtime class `twrWasmModule`.   If you wish to use C blocking functions, such as `twr_getchar` or `twr_wasm_sleep`, you can use `twrWasmModuleAsync`.  For example, this square calculator shows how to do this:  [live demo](https://twiddlingbits.dev/examples/stdio-div/index.html) or [Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-div).

## Overview of steps to integrate your C code with your JavaScript code

Here are the general steps to integrate your C with Javascript:

1. Compile your C code with clang to create the `.wasm` file.
2. On the JavaScript side you:
    1. access tiny-wasm-runtime "ES" modules in the normal way with "import". 
    2. add a `<div>` named `twr_iodiv` to your HTML (there are other options, this is the simplest)
    3. use `new twrWasmModule()`, followed by `loadWasm()`, then `callC()`.
    4. Alternately, use `twrWasmModuleAsync()` -- it is interchangeable with twrWasmModule, but proxies through a worker thread, and adds blocking support, including blocking char input

## Passing strings, arrayBuffers, etc
The Web Assembly runtime provided in a browser will only pass numbers between C functions and Javascript functions.  This means if you use `twrWasmModule.callC` to call a C function, and pass integers or floats as arguments, they will work as expected.  But if you pass a string,  arrayBuffer, or the contents or a URL, `twrWasmModule.callC` will:   
-  allocate memory in your WebAssembly.Memory (using twr_malloc)
-  copy the string (or  arrayBuffer or URL contents) into this memory, 
-  and pass the memory index (aka a pointer in C land) to your C code. 
-  If URL contents are passed, your C function will receive a pointer to the data as the first argument, and a length as the second argument.
-  If an arrayBuffer is passed to your C/C++ code, you probably will also need to pass in the length (unless it is already known).
-  Upon return, the malloced memory is freed, and if the argument was an arrayBuffer, the appropriate contents in the wasm moudle memory are copied back into the arrayBuffer.   This means that if your C code modifies a passed in block of memory, the results will be reflected back into javascript land. 

Some module functions (such as `getString`) take or return an "index:number".  Here index means an index into WebAssembly.Memory.  As far as your C code is concerned, this is a pointer.

Recalled that an arrayBuffer can be created and accessed using classes like `Uint8Array` or `Float32Array`.

See the examples "function-calls" and fft.
