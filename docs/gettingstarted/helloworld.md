---
title: Create and Run WebAssembly Hello World
description: Learn how to create your first WebAssembly C with this step-by-step example. Create code, compile with clang, execute from a file or with a local server.
---

# Create and Run WebAssembly Hello World

This section shows you, step by step, how to to create a C "hello world" program for WebAssembly (Wasm) with twr-wasm, C, HTML, and JavaScript.

You will learn how to:

- Create the helloworld.c file
- Create the index.html file
- Compile the helloworld.c code with `clang`
- Link the helloworld.o and twr.a files with `wasm-ld` to create a helloworld.wasm file
- Set the needed library and include paths to allow the twr-wasm libraries to be discovered
- Create an optional Makefile
- Execute the "hello world" program using a local web server or directly with VS Code and Chrome

You can find code for a hello world example in the folder [examples\helloworld](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/helloworld).  It is similar, but not identical to this walk through.  The primary differences are the paths for lib-c, lib-js, and include.

## Step 0: Installation
- prerequisites: install clang, wasm-ld, and python or VS Code (or both)
- Create a folder for your project, such as `hello-proj`
- `cd` into `hello-proj`
- `npm install twr-wasm`
- your folder structure should now look similar to this:
~~~
hello-proj\
├──package.json
└──node_modules\
   └──twr-wasm\
      ├──examples\
      └──include\
      └──lib-c\
      └──lib-js\
      └──LICENSE
      └──package.json
      └──readme.md
~~~

## Step 1: Create the C code
Create a file `helloworld.c` in `hello-proj`
~~~c title="helloworld.c"
#include <stdio.h>

void hello() {
   printf("hello world\n");
}
~~~

## Step 2: Create the HTML
Create a file `index.html` in `hello-proj`
~~~html title="index.html"
<!doctype html>
<html>
<head>
   <title>Hello World</title>

   <script type="importmap">
   {
      "imports": {
      "twr-wasm": "./node_modules/twr-wasm/lib-js/index.js"
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

This example uses Import Maps, which are used when **not** using a bundler like WebPack or Parcel.  For smaller projects, this can be simpler with a more clear debugging and development environment.  This is the approach we will use for this example (no bundler).

The path in the `importmap` section of `index.html` should point to the location where you installed `twr-wasm/lib-js`.  The path above is correct for this project example with the indicated folder structure.

[For more detail on import resolution see this section.](../more/imports.md)

## Step 3: Compile your C code to create your .wasm file
~~~sh
cd hello-proj
clang --target=wasm32 -nostdinc -nostdlib -isystem ./node_modules/twr-wasm/include -c  helloworld.c -o helloworld.o
wasm-ld  helloworld.o ./node_modules/twr-wasm/lib-c/twr.a -o helloworld.wasm  --no-entry --initial-memory=131072 --max-memory=131072 --export=hello 
~~~

The path to `twr.a` and to `include`  should match your installation.  The above path is correct for this example.

As an alternate to executing clang and wasm-ld from the shell, here is a Makefile that will work for this example:

~~~make title="Makefile"
CC := clang
TWRCFLAGS := --target=wasm32 -nostdinc -nostdlib -isystem  ./node_modules/twr-wasm/include
CFLAGS := -c -Wall -O3 $(TWRCFLAGS)
CFLAGS_DEBUG := -c -Wall -g -O0  $(TWRCFLAGS)

.PHONY: default

default: helloworld.wasm

helloworld.o: helloworld.c
	$(CC) $(CFLAGS)  $< -o $@

helloworld.wasm: helloworld.o 
	wasm-ld  helloworld.o ./node_modules/twr-wasm/lib-c/twr.a -o helloworld.wasm \
		--no-entry --initial-memory=131072 --max-memory=131072 \
		--export=hello 
~~~

Copy the above into a file named `Makefile` and execute with `make` (or `mingw32-make` in windows).

## Step 4: Load and execute your web page
The two easiest ways to load and execute your `index.html` web page locally are:

### Option A: Run a local web Server
You can run a local server to view your helloworld program.  

- Copy the file [server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) from the examples folder to your `hello-proj` folder (where your `index.html` resides).  
- Execute with the shell command `python server.py`.
- Open your web browser and browse to `http://localhost:8000/index.html`
- You should see 'Hello World' in the browser window!

At this pont your folder structure should look like this:

~~~
hello-proj\
└──node_modules\
└──helloworld.c
└──helloworld.o
└──helloworld.wasm
└──index.html
└──Makefile
└──package.json
└──server.py
~~~

### Option B: VS Code launch.json
Alternately, you can launch chrome without a local web server.  Add an entry similar to the following to  `hello-proj\.vscode\launch.json`.  This assumes your workspaceFolder is `hello-proj`.

~~~json title="launch.json"
{
	"configurations": [
	{
		"name": "Launch Chrome Hello, World!",
		"request": "launch",
		"type": "chrome",
		"runtimeArgs": [
			"--allow-file-access-from-files",
			"--autoplay-policy=no-user-gesture-required",
			"--enable-features=SharedArrayBuffer"
		 ],
		 "file": "${workspaceFolder}/index.html",
		 "cwd": "${workspaceFolder}/",
	}
	]
}
~~~

Once you have created this file, you:

- select the Run and Debug icon on left
- Select the green play icon at the top, with "Launch Chrome Hello, World!" selected
- Chrome should launch, and you should see 'Hello World' in the browser window!

`--autoplay-policy=no-user-gesture-required` and `--enable-features=SharedArrayBuffer` are not required for this simple "hello world" example, but will be needed if you request user input or you are using `twrWasModuleAsync`.

## See live version
You can find a live link to hello world [on this page](../examples/examples-overview.md).

## Next steps after hello world
A good way to get your own code up and running is to copy one of the [examples](../examples/examples-overview.md), get it to build and run, then start modifying it.  Note you will need to modify the paths for `include`, `lib-js`, `lib-c`, etc. based on your project structure.  The examples are all setup with relative paths assuming the folder structure `twr-wasm\examples\<example>`

The examples include Makefiles.

"Hello World" uses the twr-wasm class `twrWasmModule`.   If you wish to use C blocking functions, such as `twr_getc32` or `twr_sleep`, you should use `twrWasmModuleAsync`.  This [square calculator example](../examples/examples-divcon.md) shows how to do this.  

If you wish to build an app that makes non-block calls into C, the [balls example](../examples/examples-balls.md) shows how to do this. The [maze example](../examples/examples-maze.md) uses a combination of blocking and non-blocking C functions.

## Debugging
See the [debugging](../gettingstarted/debugging.md) section for debugging tips, including setting up Wasm source level debugging.

