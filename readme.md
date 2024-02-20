# Tiny Web Assembly Runtime

tiny-wasm-runtime allows you to run C code in a web browser.

The recommended library for compiling C code to Web Assembly is emscripten.   emscripten is much more full featured than TWR, but also much  more complex.   You might prefer TWR if you want a simpler, easier to understand runtime.  If you don't need all the features of emscripten.  Or if you prefer twr's method of HTML/JS integration.  TWR is also a good reference if you want to understand how to use Web Assembly modules "directly".

They key TWR features include:
   - A subset of the standard C runtime, including printf, malloc, string functions, etc.
   - Expanded data types supported when calling to and from HTML/JS and C 
   - Print and get characters to/from \<div\> tags in your HTML page
   - Print and get character to/from a \<canvas\> based console-terminal.
   - Allows traditional "blocking big loop" C code structure to be used with HTML/Javascript's asynchronous event model (via use of worker thread.)

# Hello World
Here is the simplest tiny-wasm-runtime example.

C code:

~~~
   #include <stdio.h>

   void hello() {
      printf("hello world\n");
   }
~~~

Called using an index.html like this:
~~~
   <!doctype html>
   <head>
      <title>Hello World</title>
   </head>
   <body>
      <div id="twr_iodiv"></div>

      <script type="module">
         import {twrWasmModule} from "tiny-wasm-runtime";
         
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
  
# The Web Assembly Runtime Problem
HTML browsers can load a Web Assembly module, and execute it's bytecode in a browser virtual machine.  You compile your code using clang with the target code format being web assembly (wasm) byte code.   There are a few issues that one immediately encounters trying to execute code that is more complicated than squaring a number.  

The first is that there is no runtime support native to a Web Assembly module.  That is, no malloc or printf or similar functions.  Even beyond than that, there are no included compiler support  functions.  That is, clang code generation will produce calls for floating point operations, memcpy, and other utility code.  This code is usually handled behind the scenes for you.  For example, gcc will link to the "gcc" lib automatically.  clang typically uses "compile-rt".  This doesn't happen with Web Assembly compiles (unless you use a wasm runtime like emscripten or tiny-wasm-runtime).

The second problem is that all the function calls between your wasm module and your javascript are limited to parameters and return valiues that are numbers (integer and float). No strings, arrays, struct pointers, etc.

The third problem is that legacy C code or games often block, and when written this way they don't naturally integrate with the Javascript asynchronous programming model.

tiny-wasm-runtime is a static C library (twr.a) that you can link to your clang C code, as well as a set of Javascript/Typescript modules.  Together they solve the above problems. tiny-wasm-runtime incudes:
   - a (tiny) C runtime library 
   - a (tiny) subset of the most common compiler utility functions. 
   - APIs that can be used to pass strings, byte arrays, etc to and from your C code to and from typescript/javascript.
   - APIs for integrating I/O and events between C and Javascript. Including streamed i/o to a \<div> and terminal-windowed i/o to a \<canvas>.
   - an asynchronous web assembly typescript/javascript class that proxies code via a worker thread allowing integration into Javascript's event loop.
  
# Version 0.9.5 Limitations 
I created twr to run some of my legacy C software in a web browser.  It doesn't implement many features beyond what I needed.  For example, I didn't port all of compile-rt, just the small subset clang needed to build and run my software.  Presumably there will be code that won't run as a result.  In addition, I didn't write an entire ANSI-C compatible runtime (or port one).  I wrote my own and left out several functions.  I also cut some corners in places.  For example, my malloc allocator is functional but, well, tiny.  In theory tiny-wasm-runtime should work with C++ as well as C, but since I have not tested it with C++, it probably doesn't.  

This version is not yet "1.0.0" and these are the items I am working on:
   - validate use of SharedArrayBuffer in WebAssembly.Memory (shared:true), is the best design choice
   - add small windowed console game example
   - add support for full resolution drawing to canvas (and example)
   - finish testing with the Web version of my classic BASIC interpreter (the reason i wrote this in the first place)
   - miscellaneous clean up 
   - improve documentation
   - maybe add a few more crt functions; maybe test with C++

# Installation
~~~
   npm install tiny-wasm-runtime
~~~

 **Installs for your C code**

  To build C code for use in your wasm project, you will need to install clang and the wasm-ld linker.  For windows, more details can be found later in this readme. For other platforms, you are on your own.

**Examples**

Examples can be found in tiny-wasm-runtime/examples.  If you installed using npm, then these will be in the node_modules/tiny-wasm-runtime/examples folder.  They are also on github.

**Source Code**

https://github.com/twiddlingbits/tiny-wasm-runtime


# More Examples
## stdio-div
I/O can be directed to or from a \<div> or a \<canvas> tag.  Here is a simple example using a \<div> for stdio input and output.

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
		import {twrWasmAsyncModule} from "tiny-wasm-runtime";
		
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

## stdio-canvas
This example shows how to display a string in a windowed-terminal, and how to get character input.

~~~
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "twr-crt.h"
#include "twr-wasm.h"

/* this tiny-wasm-runtime C example draws a string in the middle of a windowed console, */
/* and allows the user to move the string up or down with the u or d keys  */

/* see include/twr-io.h for available functions to draw chars to windowed console */

void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str);
void set_xy_cursorpos(struct IoConsoleWindow* iow, int x, int y);

void stdio_canvas() {
    struct IoConsoleWindow* iow=(struct IoConsoleWindow*)twr_get_stdio_con();

    if (!(iow->con.header.type&IO_TYPE_WINDOW)) {  // could also use assert here
        io_printf(twr_wasm_get_debugcon(), "error - expected window console\n");
        return;
    }

    int h, c;
    const char* str="Hello World (press u or d)";
    const char* spc="                          ";

    h=iow->display.io_height/2;

    while (1) {
        show_str_centered(iow, h,  str);
        c=twr_getchar();
        show_str_centered(iow, h,  spc);   // erase old string
        
        if (c=='u') { 
            h=h-1;
            if (h<0) h=0;
        }
        if (c=='d') {
            h=h+1;
            if (h>=iow->display.io_height) h=iow->display.io_height-1;
        }
    }
}

void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str) {
    int strlen=strlen(str);
    int x=(iow->display.io_width-strlen)/2;

    set_xy_cursorpos(iow, x, h);
    io_putstr(&iow->con, str);
}

void set_xy_cursorpos(struct IoConsoleWindow* iow, int x, int y) {
    if (iow->display.io_width*y+x >= iow->display.io_width*iow->display.io_height)
            io_set_cursor(iow, 0); // out of range, pick an in-range position.
    else {
        io_set_cursor(iow, iow->display.io_width*y+x); 
    }
}
~~~

~~~
<!doctype html>
<head>
	<title>stdio-canvas example</title>
</head>
<body>
	<canvas id="twr_iocanvas" tabindex="0"></canvas>

	<script type="module">
		import {twrWasmModuleAsync} from "tiny-wasm-runtime";
		
		let amod;
		
		try {
			amod = new twrWasmModuleAsync({windim:[50,20], forecolor:"beige", backcolor:"DarkOliveGreen", fontsize:18});
		} catch (e) {
			console.log("exception in HTML script new twrWasmModuleAsync\n");
			throw e;
		}

		document.getElementById("twr_iocanvas").focus();
		document.getElementById("twr_iocanvas").addEventListener("keydown",(ev)=>{amod.keyDownCanvas(ev)});

		amod.loadWasm("./stdio-canvas.wasm").then( ()=>{
			 amod.executeC(["stdio_canvas"]).then( (r) => { 
				console.log("executeC returned: "+r);
			}).catch(ex=>{
				console.log("exception in HTML script loadWasm() or executeC()\n");
				throw ex;
			});
		});

	</script>
</body>
</html>
 ~~~

## Overview of steps to integrate your C code with your HTML/JS code
A good way to get your own code up and running is probably to copy one of the tiny-wasm-runtime/examples, get it to build and run, then start modifying it.   

For my own code development that I am using tiny-wasm-runtime in, I use a different method.  My project doesn't have a huge amount of HTML code, and i have no server side logic.  So I use the following:
   - I use VS Code on Windows
   - I added tiny-wasm-runtime as a git submodule to my project, so i can debug using the typescript source
   - I use the VS Code debugger with a launch configured to use Chrome (see the end for details on this)
   - I don't use a bundler for development.  I just run my code in Chrome from the local filesystem 
   - I don't use a local dev server since my code all runs in the browser from the file system 

That all said, here is an overview of the steps you will need to do:

1. Compile your C code with clang
   - See GNU Makefile in examples
   - In your clang compile commands you will need to add the tiny-wasm-runtime/include folder with -I YOURPATH/tiny-wasm-runtime/include.  If you installed using npm, then these will be in the node_modules/tiny-wasm-runtime folder.  See the Makefiles in examples for how to add the -I flag.
   - In your clang linker command, you will need to export the C functions used by tiny-wasm-runtime as well as your functions that you wish to call.  Again, see Makefile for examples.
   - In your clang linker command, you will need to link to twr.a

2. On the HTML/JS side you:
   1. access tiny-wasm-runtime "ES" modules in the normal way with "import". 
   2. add a \<div\> named 'twr_iodiv' (there are other options, this is the simplest)
   3. use "new twrWasmModule()", followed by loadWasm(), then executeC().
   4. Alternately, use twrWasmAsyncModule() -- it is basically interchangable with twrWasmModule, but proxies through a worker thread, and adds getchar() type functions

# Passing strings, byte arrays, and the contents pointed to by an URL
Web Assembly will only pass numbers to and from C functions or Javascript functions at its core.  This means if you use twrWasmModule.executeC() (see Overview of Typescript/Javascript APIs below) to call a C function, and pass integers or floats as arguments, they will work as expected.  But if you pass a string, byte array, or the contents or a URL, twrWasmModule will allocate memory in your WebAssembly.Memory (using twr_malloc), copy the string (or other byte array or URL contents) into this memory, and pass the memory index to your C code. If a byte array or a URL contents is passed, your C function will receive a pointer to the data as the first argument, and a length as the second argument. See the example "function-calls".

# tiny-wasm-runtime C APIs
A subset of the standard C runtime is implemented.  The source for these use the "twr_" function prefix (for example, twr_printf).  These also have standard C runtime names defined (for example, printf is defined in the usual stdio.h).  

The subset of implemented std c lib functions can be found in the tiny-wasm-runtime/include folder.

There are some twr_ runtime functions that are not standard C runtime.  For example, use twr_gets() to read a string input from stdio.  

All of the available twr-crt functions can be found at:
   - \tiny-wasm-runtime\include\twr-crt.h

There are some wasm specific C APIs.   These are used by the typescript APIS, and generally don't need to be called directly. The exception is 

~~~
twr_wasm_get_debugcon()
~~~

which is handy for debug prints in your code.  These functions can be found in:
   - \tiny-wasm-runtime\include\twr-wasm.h

# Console I/O
See \tiny-wasm-runtime\include\twr-io.h

C character based input/output is abstracted by:

~~~
struct IoConsole
~~~

Consoles can be "tty" aka "streamed", or they can be "windowed".

Windowed consoles allow text to be placed in assigned positions in the canvas windowed-terminal.  They also support very chunky (low res) graphics.  Each character cell can be used as a 2x3 graphic array.   See the examples.

There are four consoles that generally exist in the tiny-wasm-runtime world:
   1. null - goes to the preverbal bit bucket
   2. debug - output only.  Goes to the Web Browser debug console.
   3. div - streamed input/output to a \<div> tag
   3. canvas - streamed or windowed input/output to a \<canvas> tag.  You can specify the width and height by the number of characters.  For example, 80X40.  The font is fixed width courier.

stdio can be set using twrWasmModule() and twrWasmAsyncModule() constructor options.  Commonly, if the options are not set, stdio is automatically set as follows:
   - twrDiv if a \<div> named 'twr_iodiv' exists
   - else twrCanvas if a \<canvas> named 'twr_iocanvas' exists
   - else debug

stdlib functions like printf will send their output to the assigned stdio console. But you can also send output to a console that is not assigned as stdio.  For example:

~~~
   #include "twr-wasm.h"

   io_printf(twr_wasm_get_debugcon(), "hello over there in browser debug console land\n");
~~~

Here are some more i/o functions:

~~~
struct IoConsole * twr_get_stdio_con();

struct IoConsole* twr_get_nullcon();
struct IoConsole* twr_wasm_get_debugcon();

struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_windowcon(int, int);

void io_putc(struct IoConsole* io, char c);
void io_putstr(struct IoConsole* io, const char* s);
char io_inkey(struct IoConsole* io);
void io_close(struct IoConsole* io);
void io_printf(struct IoConsole *io, const char *format, ...);
int io_getc(struct IoConsole* io);
char *io_gets(struct IoConsole* io, char *buffer );
int io_get_cursor(struct IoConsole* io);

void io_cls(struct IoConsoleWindow* iow);
void io_set_c(struct IoConsoleWindow* iow, int loc, unsigned char c);
bool io_setreset(struct IoConsoleWindow* iow, short x, short y, bool isset);
short io_point(struct IoConsoleWindow* iow, short x, short y);
void io_set_cursor(struct IoConsoleWindow* iow, int loc);
void io_draw_range(struct IoConsoleWindow* iow, int x, int y);

~~~


# Overview of Typescript/Javascript APIs

Use either twrWasmModule or twrWasmAsyncModule to load and access your .wasm module (your compiled C code). These two modules are similar, except that the Async version proxies everything through a worker thread, which allows blocking C functions and also supports input from stdio.

The basic sequence is to create a new twrWasmModule (or twrWasmAsyncModule), use "loadWasm" to load your .wasm module, and then call "executeC" to execute your C functions.  

~~~
	constructor(opts:IModOpts|undefined)
	async loadWasm(urToLoad:URL)
	async executeC(params:[string, ...(string|number|Uint8Array|URL)[]]) 
~~~

these are the options:
~~~
   type TStdioVals="div"|"canvas"|"null"|"debug";

   interface IModOpts {
      stdio?:TStdioVals, 
      windim?:[number, number],
      forecolor?:string,
      backcolor?:string,
      fontsize?:number,
      imports?:{},
   }

   see: \tiny-wasm-runtime\twr-wasm-ts
~~~

A module constructor has an optional options, which can be used to specify where stdio is directed. You can also set the size of your termianl-window here (in XxY characters), as well as colors and fontsizes.   

If you don't set stdio, the following will be used:
   - \<div id="twr_iodiv"> will be used if found.
   - \<canvas id="twr_iocanvas> will be used if it exists and no div found.  A canvas will be used to create a simple terminal (see examples)
   - if neither div or canvas is defined in your HTML, then stdout is sent to the debug console in your browser.
   - If you use options, a forth "null" options is available. 

executeC takes an array where:
   - the first entry is the name of the C function in the wasm module to call (must be exported, typically via the --export clang flag)
   - and the next entries are a variable number of parameters to pass to the C function, of type:
      - number - converted to int32 or float64 as appropriate
      - string - converted to a an index (ptr) into a module Memory 
      - URL - the url contents are loaded into module Memory, and two C parameters are generated - index (pointer) to the memory, and length
      - Uint8Array - the array is loaded into module memory, and two parameters are generated - index (pointer) to the memory, and length

executeC returns the valued returned by the C function that was called.  As well int and float, strings and structs (or blocks of memory) can be returned.   

More details can be found in the examples folder.

# Building the Examples

Examples can be found in tiny-wasm-runtime/examples.  If you installed using npm, then these will be in the node_modules/tiny-wasm-runtime folder.  They are also on github.

To build and execute an example do this:
1. cd to the example folder (eg. helloworld)
2. make
3. cd dist
4. Python server.py
5. browse to http://localhost:8000/

**Prerequisites**:
   - Ensure clang and wasm-ld are installed
   - Ensure a version of GNU make is installed (to use the Makefiles).  
   - the examples use parcel v2 as a bundler ( npm install --save-dev parcel )
   - to run the examples on your local machine using the provided server script (server.py), you need to install python.  This script sets certain CORS headers needed by SharedArrayBuffer, that are not usually set using other dev servers.

If you get this error "@parcel/core: Failed to resolve 'tiny-wasm-runtime' from './examples/.../index.html'", you likely need to "npm install" at the shell in the folder containing the example's package.json file.  This will install dependencies.

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