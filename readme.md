# Tiny Web Assembly Runtime (twr)
This twr library allows you to easily port or run C code in a web browser.

The recommended library for compiling C code to Web Assembly is emscripten (there is also the WASI in the works.)  emscripten is much more full featured than TWR, but also more complex.   You might prefer TWR if you want a simpler, easier to understand runtime.  Or if you prefer its method of HTML/JS integration.

They key TWR features include:
   - A subset of the standard C runtime, including printf, getch, malloc, string functions, etc.
   - Optionally integrates traditional "blocking big loop" C code structure into HTML/Javascript's asynchronous event model (via use of worker thread and various proxy messages)
   - Print and get character based I/O from/to \<div\> tags in your HTML Page
   - Print and get character based I/O from/to a \<canvas\> based "terminal"
   - TO FINISH - optionally receive asynchronous events and draw to a 2D \<canvas\>
  
# The Web Assembly Runtime Problem
HTML browsers can load a Web Assembly module, and execute it's bytecode in a browser virtual machine.  You compile your code using clang with the target code format being web assembly (wasm) byte code.   There are a few issues that one immediately encounters trying to execute code that is more complicated than squaring a number.  

The first is that there is no runtime support native to a Web Assembly module.  That is, no malloc or printf or similar functions.  Even beyond than that, there are no included compiler support  functions.  That is, clang code generation will produce calls for floating point operations, memcpy, and other utility code.  This code is usually handled behind the scenes for you.  For example, gcc will link to the "gcc" lib automatically.  clang typically uses "compile-rt".  This doesn't happen with Web Assembly compiles.

The second problem is that all the function calls between your wasm module and your javascript are limited to parameters that are numbers (integer and float) and also for their return values. No strings, arrays, struct pointers, etc.

The third problem is that legacy C code or games often block, and when written this way they don't naturally integrate with the Javascript asynchronous programming model.

TWR is static library that you can link to your clang code, that solves these issues.   TWR provides:
   - a (tiny) C runtime library along with 
   - a (tiny) subset of the most common compiler utility functions. 
   - APIs that can be used to pass strings, byte arrays, etc to and from your C code to and from typescript/javascript.
   - APIs for integrating I/O and events between C and Javascript.
   - an optional asynchronous web assembly typescript/javascript class that executes your compiled code in a worker thread with integration into the primary javascript event loop

# TWR Limitations
I created twr to run some of my legacy C software in a web browser.  It doesn't implement many features beyond what I needed.  For example, I didn't port all of compile-rt, just the small subset clang needed to build and run my software.  Presumably there will be code that won't run as a result.  In addition, I didn't write an entire ANSI-C compatible runtime (or port one).  I wrote my own and left out some (many?) functions.  I also cut some corners in places I thought didn't matter for wasm.  For example, my malloc allocator is, well, tiny.  

# Installation
   tbd



# Basic steps to integrate your C code with your HTML/JS code
1. Compile your C code with clang and link to twr.a (see GNU Makefile in examples)
2. You may (or may not) need small proxy C functions that provide the API between your C code and the Javascript side.
3. On the HTML side you:
   1. add a \<div\> named 'twr_iodiv' (there are other options, this is the simplest)
   2. use "new twrWasmAsyncModule()", followed by loadWasm(), then executeC().

# Hello World Example
Examples can be found in the examples folder.  See the examples folder for the makefiles, and how to correctly use the clang compiler to build for wasm.   Here is the simplest example:

To run the following C hello() function in your web browser:
~~~
   #include <stdio.h>

   void hello() {
      printf("hello world\n");
   }
~~~

Using an index.html like this:
~~~
   <!doctype html>
   <head>
      <title>Hello World</title>
   </head>
   <body>
      <div id="twr_iodiv"></div>

      <script type="module">
         import {twrWasmModule} from "twrmod";
         
         let mod = new twrWasmModule();

         mod.loadWasm("./helloworld.wasm").then( ()=>{
            mod.executeC(["hello"]).then( (r) => { 
               console.log("executeC returned: "+r);
            })
         });

      </script>
   </body>
   </html>
~~~

# stdio-div Example
I/O can be directed to or from a \<div> or a \<canvas> tag.  Here is a simple example using a \<div> for stdio.

~~~
#include <stdio.h>
#include <stdlib.h>
#include "twr-crt.h"

void stdio_div() {
    char inbuf[64];
    int i;

    printf("Square Calculator\n");

    while (1) {
        printf("Enter an integer: ");
        twr_gets(inbuf);
        i=atoi(inbuf);
        printf("%d squared is %d\n\n",i,i*i);
    }
}
~~~

With an index.html like the following.  This time we are using twrWasmAsyncModule which integrates blocking C code into Javascript.  twrWasmAsyncModule can also be used to receive key input from a \<div> or \<canvas> tag. This example also shows how to catch errors.

~~~
<!doctype html>
<head>
	<title>stdio-div example</title>
</head>
<body>
	<div id="twr_iodiv" tabindex="0">Loading... <br></div>

	<script type="module">
		import {twrWasmAsyncModule} from "twrasyncmod.js";
		
		let amod;
		
		try {
			amod = new twrWasmAsyncModule();
		} catch (e) {
			console.log("exception in HTML script new twrWasmAsyncModule\n");
			throw e;
		}
		document.getElementById("twr_iodiv").innerHTML ="<br>";
		document.getElementById("twr_iodiv").addEventListener("keydown",(ev)=>{amod.keyDownDiv(ev)});

		amod.loadWasm("./stdio-div.wasm").then( ()=>{
			 amod.executeC(["stdio_div"]).then( (r) => { 
				console.log("executeC returned: "+r);
			}).catch(ex=>{
				console.log("exception in HTML script loadWasm() or executeC()\n");
				throw ex;
			});
		});

	</script>
</body>
~~~

# How to compile your C code
See the GNU Makefiles in the examples folder.

# A bit more about the examples
   - I used parcel as the javscript bundler for the examples.  You should install it globally using npm if you want to build the examples.
   - I include a very simple python script (server.py) to execute the examples using a local server.  To use this script, you will need to install python.   The reason I use this script (and not, for example, the built in parcel dev server) is that Tiny Wasm Runtime uses SharedArrayBuffers, and there are special CORS HTTP headers needed, that are not widely implemented by default.  server.py shows which headers to set (also see the SharedArrayBuffer documentation online).  

To build and execute an example you do this:
1. cd to the example folder (eg. helloworld)
2. make
3. cd dist
4. Python server.py
5. browse to http://localhost:8000/

# Overview of C APIs
A subset of the standard C runtime is implemented.  The source for these use the "twr_" function prefix (for example, twr_printf).  These also have standard C runtime names defined (for example, printf is defined in the usual stdio.h).  There are some useful twr_ runtime functions that are not standard C runtime.  For example, use twr_gets() to read a string input from stdio.  

All of the available crt functions can be found at:
   - \tiny-wasm-runtime\include\twr-crt.h

As well as the C runtime, there are a few functions that are for supporting wasm.  These are used by the typescript APIS, and generally don't need to be called directly. These functions can be found in:
   - \tiny-wasm-runtime\include\twr-wasm.h

That said, there are some functions that you might find useful.  For example:

~~~
struct IoConsole* twr_wasm_get_debugcon();
~~~

can be used to get a console that always exists, and can be used like this:

~~~
   #include "twr-wasm.h"

   io_printf(twr_wasm_get_debugcon(), "hello over there in browser debug console land\n");

~~~

# Overview of Typescript/Javascript APIs

Use either twrWasmModule or twrWasmAsyncModule to load and access your .wasm module (your compiled C code).  See the examples for details on how to use.  These two modules are similar, except that the Async version proxies everything through a worker thread, which allows blocking C functions and also supports input from stdio.

The basic sequence is to create a new twrWasmModule (or twrWasmAsyncModule), use "loadWasm" to load your .wasm module, and then call "executeC" to execute your C functions.  

~~~
	async loadWasm(urToLoad:string|URL, opts:IloadWasmOpts={})
	async executeC(params:[string, ...(string|number|Uint8Array|twrFileName)[]]) 

   see: \tiny-wasm-runtime\twr-wasm-api-ts
~~~

loadWasm has an optional IloadWasmOpts, which can be used to specify where stdio is directed. If you don't set this, the following will be used:
   - \<div id="twr_iodiv"> will be used if found.
   - \<canvas id="twr_iocanvas> will be used if it exists and no div found.  A canvas will be used to create a simple terminal (see examples)
   - if neither div or canvas is defined in your HTML, then stdout is sent to the debug console in your browser.
   - If you use IloadWasmOpts, a forth "null" options is available. 

executeC takes an array where:
   - the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
   - and the next entries are a variable number of parameters to pass to the C function, of type:
      - number - converted to int32 or float64 as appropriate
      - string - converted to a an index (ptr) into a module Memory returned via stringToMem()
      - twrFileName - the file contents are loaded into module Memory via fileToMem(), and two C paramters are generated - index (pointer) to the memory, and length
      - Uint8Array - the array is loaded into module memory via uint8ArrayToMem(), and two parameters are generated - index (pointer) to the memory, and length

More details can be found in the examples folder.

# Using Chrome locally to test

If you are using Chrome on your local machine to test, you will need to set this flag:
"--enable-features=SharedArrayBuffer".  In addition, to test .wasm files loaded from your local file system, also set "--allow-file-access-from-files".  For example, below is the VS Code launch.json entry I use in one of my projects that uses tiny-wasm-runtime:

~~~
{
    "configurations": [
        {
        "type": "chrome",
        "request": "launch",
        "runtimeArgs": ["--allow-file-access-from-files","--autoplay-policy=no-user-gesture-required","--enable-features=SharedArrayBuffer"],
        "name": "index.html",
        "file": "${workspaceFolder}/index.html",
            "cwd": "${workspaceFolder}"
    }
 ]
}
~~~

# Important production deployment note
Tiny Wasm Runtime uses SharedArrayBuffers, and there are special CORS headers needed for these, that are not widely enabled by default.  server.py shows which headers to set (also see the SharedArrayBuffer documentation online).  


# To Build Source with Windows
I wrote this using Windows, but it should work with any clang and typescript compatible platform.

I use gcc for code that needs to run from the shell (as opposed to code that builds for Web Assembly).  For example, the unit tests.

clang is used for the Web Assmembly builds.

GNU make is used for the makefiles.

If you are using windows, here is the software I installed to do a build:

~~~
 install  MSYS2 
   1. https://www.msys2.org/
   2. After the install completes, run UCRT64 terminal by clicking on the MSYS2 UCRT64 in the Start menu
   3. pacman -Syuu

 install gcc using MSYS2 UCRT64
   1. Use MSYS2 UCRT64 terminal (per above)
   1. pacman -S mingw-w64-ucrt-x86_64-toolchain

 install clang using MSYS2 UCRT64
   2. Use MSYS2 UCRT64  (per above)
      1. pacman -S mingw-w64-ucrt-x86_64-clang
      2. pacman -S mingw-w64-x86_64-lld

update PATH env variable using the windows control panel (search for path)
   2. added C:\msys64\ucrt64\bin 
   3. added C:\msys64\mingw64\bin 
   4. added C:\msys64\usr\bin (for sh.exe used by mingw32-make)
~~~
  
  Optional: 
   not strictly required, but i installed wabt: https://github.com/WebAssembly/wabt/releases 