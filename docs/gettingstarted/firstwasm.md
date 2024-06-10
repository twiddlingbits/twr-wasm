# Your First C Web Assembly Program
You can find all of the code for this section in the folder [examples\helloworld](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/helloworld).

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
      "tiny-wasm-runtime": "../../lib-js/index.js",
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

The relative path in the `importmap` section should be updated to point to the location where you installed `tiny-wasm-runtime/lib-js`.  The path above is correct if your file is in an `example` subfolder.

## Step 3: Compile your C code to create your .wasm file
~~~
clang --target=wasm32 -nostdinc -nostdlib -isystem ../../include -c  helloworld.c -o helloworld.o
wasm-ld  helloworld.o ../../lib-c/twr.a -o helloworld.wasm  --no-entry --initial-memory=131072 --max-memory=131072 --export=hello 
~~~

The path to `twr.a` and to `include`  may need to be updated to match your installation.  The above path is correct if your code is in an `example` subfolder.

## Step 4: Load your web page
The two easiest ways to load and execute your `index.html` web page locally are:

### Option A: Run a local web Server
You can run a local server to view your helloworld program.  Copy the file [server.py](https://github.com/twiddlingbits/tiny-wasm-runtime/blob/main/examples/server.py) from the examples folder to your project folder where your index.html resides.  Execute with the shell command `python server.py`.

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

`--autoplay-policy=no-user-gesture-required` and `--enable-features=SharedArrayBuffer` are not required for this simple "hellow world" example, but will be needed if you request user input or you are using twrWasModuleAsync.

## See live version
[Here is a link](/examples/helloworld/index.html) to the helloworld function running in the `twiddlingbits.dev` site.

## Next steps after hello world
A good way to get your own code up and running is to copy one of the [tiny-wasm-runtime/examples](../examples/examples-overview.md), get it to build and run, then start modifying it.  

The example makefiles prove a more practical way to configure and execute clang and wasm-ld.

"Hello World" uses the tiny-wasm-runtime class `twrWasmModule`.   If you wish to use C blocking functions, such as `twr_getc32` or `twr_sleep`, you can use `twrWasmModuleAsync`.  This [square calculator example](../examples/examples-stdio-div.md) shows how to do this.  

If you wish to build an app that makes non-block calls into C, the [balls example](../examples/examples-balls.md) shows how to do this. The [maze example](../examples/examples-maze.md) uses a combination of blocking and non-blocking C functions.

