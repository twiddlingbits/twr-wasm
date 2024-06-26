# Hello World - Step-by-Step C to WASM

This section shows you step by step how to to create a C "hello world" program for WebAssembly (WASM) with twr-wasm, C, HTML, and JavaScript.

You will learn how to:

- Create the helloworld.c C file
- Create the index.html HTML File
- Compile the helloworld.c code 
- Link the helloworld.o and twr.a files to create a helloworld.wasm file
- Set the needed library and include paths to allow the twr-wasm libraries to be discovered
- Create an optional Makefile
- Execute the "hello world" program using a local web server or directly with VS Code and Chrome


You can find all of the code for this section in the folder [examples\helloworld](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/helloworld).

## Step 1: Create the C code
Create a file `helloworld.c`
~~~
#include <stdio.h>

void hello() {
   printf("hello world\n");
}
~~~

## Step 2: Create the HTML
Create a file `index.html`
~~~
<!doctype html>
<html>
<head>
   <title>Hello World</title>

   <script type="importmap">
   {
      "imports": {
      "twr-wasm": "../../lib-js/index.js",
      }
   }
   </script>

</head>
<body>
   <div id="twr_iodiv"></div>

   <script type="module">
      import {twrWasmModule} from "twr-wasm";
      
      const mod = new twrWasmModule();
      await mod.loadWasm("./helloworld.wasm");
      await mod.callC(["hello"]);
   </script>
</body>
</html>
~~~

This example uses Import Maps, which are used when not using a bundler like WebPack or Parcel.  This can be a simpler and more clear debugging and development environment.

The relative path in the `importmap` section should be updated to point to the location where you installed `twr-wasm/lib-js`.  The path above is correct if your file is in an `example` subfolder.

As another example, if you used `git clone https://github.com/twiddlingbits/twr-wasm` to create a folder named `twr-wasm` and you create your hello world project with a folder structure like this:

~~~
my_project/
├── twr-wasm/
└── index.html
└── helloworld.c
└── helloworld.wasm
~~~

Then you would use an Import Map code snippet like this:

~~~
<script type="importmap">
{
	"imports": {
	"twr-wasm": "./twr-wasm/lib-js/index.js"
	}
}
</script>
~~~


## Step 3: Compile your C code to create your .wasm file
~~~
clang --target=wasm32 -nostdinc -nostdlib -isystem ../../include -c  helloworld.c -o helloworld.o
wasm-ld  helloworld.o ../../lib-c/twr.a -o helloworld.wasm  --no-entry --initial-memory=131072 --max-memory=131072 --export=hello 
~~~

The path to `twr.a` and to `include`  may need to be updated to match your installation.  The above path is correct if your code is in an `example` subfolder.

Alternately, if you had the folder structure described in Step 2:

~~~
my_project/
├── twr-wasm/
└── index.html
└── helloworld.c
└── helloworld.wasm
└── Makefile
~~~

You could use a MakeFile like this:
~~~
CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  twr-wasm/include
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: default

default: helloworld.wasm

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

helloworld.wasm: helloworld.o 
	wasm-ld  helloworld.o twr-wasm/lib-c/twr.a -o helloworld.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=hello 
~~~

## Step 4: Load your web page
The two easiest ways to load and execute your `index.html` web page locally are:

### Option A: Run a local web Server
You can run a local server to view your helloworld program.  Copy the file [server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) from the examples folder to your project folder where your index.html resides.  Execute with the shell command `python server.py`.

### Option B: VS Code launch.json
Alternately, you can launch chrome without a local web server.  Add an entry similar to the following to your VS code project's `.vscode\launch.json`.  Adjust the `file` and `cwd` lines to be correct for your project.
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

`--autoplay-policy=no-user-gesture-required` and `--enable-features=SharedArrayBuffer` are not required for this simple "hello world" example, but will be needed if you request user input or you are using twrWasModuleAsync.

## See live version
[Here is a link](/examples/helloworld/index.html) to the helloworld function running in the `twiddlingbits.dev` site.

## Next steps after hello world
A good way to get your own code up and running is to copy one of the [twr-wasm/examples](../examples/examples-overview.md), get it to build and run, then start modifying it.  

The example makefiles prove a more practical way to configure and execute clang and wasm-ld.

"Hello World" uses the twr-wasm class `twrWasmModule`.   If you wish to use C blocking functions, such as `twr_getc32` or `twr_sleep`, you can use `twrWasmModuleAsync`.  This [square calculator example](../examples/examples-stdio-div.md) shows how to do this.  

If you wish to build an app that makes non-block calls into C, the [balls example](../examples/examples-balls.md) shows how to do this. The [maze example](../examples/examples-maze.md) uses a combination of blocking and non-blocking C functions.

