# Tiny Web Assembly Runtime

tiny-wasm-runtime allows you to run C code in a web browser.  It's great for running legacy C code in a browser.  Either full applications, or functions that are not readily available in Javascript. A lot C code has been written over the years.

The recommended library for compiling C code to Web Assembly is emscripten.   emscripten is much more full featured than tiny-wasm-runtime, but also much  more complex.   You might prefer tiny-wasm-runtime if you want a simpler, easier to understand runtime.  If you don't need all the features of emscripten.  Or if you prefer twr's method of HTML/JS integration.  tiny-wasm-runtime is also a good reference if you want to understand how to use Web Assembly modules "directly".

They key tiny-wasm-runtime features include:
   - A subset of the standard C runtime, including printf, malloc, string functions, etc.
   - Pass and return strings, structs, files when calling to and from HTML/JS and C 
   - Print and get characters to/from \<div\> tags in your HTML page
   - Print and get character to/from a \<canvas\> based "terminal".
   - Use 2D drawing API in C to draw to a \<canvas\>
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
   - APIS for drawing to a canvas
   - an asynchronous web assembly typescript/javascript class that proxies code via a worker thread allowing integration into Javascript's event loop.
  
# Version 0.9.7 Limitations 
   - Not all of compile-rt is ported
   - Not all ansi stdlib functions are implemented
   - Most string functions use ASCII, not for example, UTF-8
   - In theory tiny-wasm-runtime should work with C++ as well as C, but since I have not tested it with C++, it probably doesn't.
   - Designed to work with a browser.  Not tested with or designed to work easily with node.js  

This version is not yet "1.0.0" and these are the items I am working on:
   - add more robust canvas drawing support to the d2d API
   - improve malloc heap to dynamically use avail memory (right now it is hard coded in malloc.c)
   - add more examples, miscellaneous polish, improve documentation
   - maybe add a few more crt functions; maybe test with C++
   - post requests on github https://github.com/twiddlingbits/tiny-wasm-runtime/issues
   - Has only been tested with chrome

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

 <img src="./readme-img-square.png" width="500">

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

With an index.html like the following.  This time we are using twrWasmModuleAsync which integrates blocking C code into Javascript.  twrWasmModuleAsync can also be used to receive key input from a \<div> or \<canvas> tag. This example also shows how to catch errors.

~~~
<!doctype html>
<head>
	<title>stdio-div example</title>
</head>
<body>
	<div id="twr_iodiv" tabindex="0">Loading... <br></div>

	<script type="module">
		import {twrWasmModuleAsync} from "tiny-wasm-runtime";
		
		let amod;
		
		try {
			amod = new twrWasmModuleAsync();
		} catch (e) {
			console.log("exception in HTML script new twrWasmModuleAsync\n");
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
A tiny "terminal" can be created with a \<canvas> tag, and you can use it for character I/O with control over where the character appear in the terminal window.

This example will move a string up or down in the terminal window when you press the u or d key.

 <img src="./readme-img-terminal.png" width="400">

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

## Maze
The maze example is a windows win32 C program I wrote 20+ years ago, running in a web browser using tiny-wasm-runtime.  I have included the TypesScript below.  You can see the C code in the examples/maze folder.

This C is interesting in that it is a combination of blocking and non blocking functions.  The CalcMaze() function is blocking when the "slow draw" flag is set.  It uses Sleep() in this case.   For this reason, I use twrWasmModuleAsync.   The solve section uses repeated calls to SolveStep(), which works well with a Javascript main loop.  I used a javascript interval timer to make repeated calls to the C SolveStep().  If all the C code was structured this way, twrWasmModule could have been used (instead of the Async version)

To port this code to tiny-wasm-runtime I wrote a (very tiny) Win32 compatible API.  It only implements the features needed to port maze, but it might be useful to use as a starting point for porting Win32 code to the web.  In the maze example, the two files are winemu.c and winemu.h.   You use winemu.h to replace windows.h

This example (in winemu.c) uses the tiny-wasm-runtime "d2d" (Draw 2D) APIs.  These allow drawing onto an HTML canvas from C.


 <img src="./readme-img-maze.png" width="400">

~~~
<!doctype html>
<head>
	<title>Maze</title>
</head>
<body style="background-color:powderblue">
	<canvas id="twr_d2dcanvas" width="600" height="600"></canvas>

	<script type="module">
		import {mazeRunner} from "./maze-script.js";
		
		mazeRunner();
	</script>
</body>
</html>
 
~~~
~~~
import {twrWasmModuleAsync} from "tiny-wasm-runtime";

export async function mazeRunner() {

    const amod=new twrWasmModuleAsync();

    await amod.loadWasm('maze.wasm');
    
    //void CalcMaze(HWND hWnd, LONG cell_size, LONG is_black_bg, LONG isd - slow draw)
    await amod.executeC(["CalcMaze", 0, 7, 0, 1]);
    await amod.executeC(["SolveBegin"]);

    let timer = setInterval(async ()=>{
        let isdone=await amod.executeC(["SolveStep", 0]);  //SolveStep(hwnd))
        if (isdone) clearInterval(timer);
    }, 50);
}
~~~

# TypeScript/JavaScript API Overview
Two TypeScript classes provide tiny-wasm-runtime APIs

~~~
import {twrWasmModule, twrWasmModuleAsync} from "tiny-wasm-runtime";

class twrWasmModule
class twrWasmModuleAsync
~~~

These two classes implement compatible APIS.  If your C code blocks, or if you are unsure, use twrWasmModuleAsync.  If you want better performance and don't need the capabilities of twrWasmModuleAsync, you can use twrWasmModule.

Use either twrWasmModule or twrWasmModuleAsync to:
   - 'loadWasm()' to load your .wasm module (your compiled C code).
   - 'executeC()' to call a C function

The Module classes have TypeScript APIs detailed in this section.  But these classes also implement the features needed by the C runtime.

You must use **twrWasmModuleAsync** in order to:
   - call any blocking C function (meaning it takes "a long time") to return
   - use blocking input from a div or canvas ( eg. with twr_gets() )
   - use twr_wasm_sleep()

## key input
In order to receive keyboard input using **twrWasmModuleAsync** you should add a line like the following to your Javascript:


for twr_iodiv:
~~~
document.getElementById("twr_iodiv").addEventListener("keydown",(ev)=>{amod.keyDownDiv(ev)});
~~~

for twr_iocanvas:
~~~
document.getElementById("twr_iocanvas").addEventListener("keydown",(ev)=>{amod.keyDownCanvas(ev)});
~~~

You likely want a line like this to set the focus to the div or canvas so the user doesn't have to click on it:

~~~
document.getElementById("twr_iocanvas").focus();
~~~

in your C code, you can get key input from stdin via:
~~~
int twr_getchar();
char* twr_gets(char* buffer);
~~~

  
## constructor
The twrWasmModule and twrWasmModuleAsync constructor both take optional options.

examples
~~~
let amod=new twrWasmModuleAsync();

let amod=new twrWasmModuleAsync({
   windim:[50,20], 
   forecolor:"beige", 
   backcolor:"DarkOliveGreen", 
   fontsize:18
   });
~~~

these are the options:
~~~
export type TStdioVals="div"|"canvas"|"null"|"debug";

export interface IModOpts {
	stdio?:TStdioVals, 
	windim?:[number, number],
	forecolor?:string,
	backcolor?:string,
	fontsize?:number,
	isd2dcanvas?:boolean,
	imports?:{},
}
~~~

### stdio
You can explicitly set your stdio source with the stdio option, but typically you don't set it.  Instead, it will be set as follows:
   - \<div id="twr_iodiv"> will be used if found.
   - \<canvas id="twr_iocanvas"> will be used if it exists and no div found.  A canvas will be used to create a simple terminal (see examples)
   - if neither div or canvas is defined in your HTML, then stdout is sent to the debug console in your browser.
   - If you use options, a forth "null" options is available. 
### windim
This options is used with a terminal console ( \<canvas id="twr_iocanvas"> ) to set the width and height, in characters.

The canvas width and height, in pixels, will be set based on your fontsize and the width and height (in characters) of the terminal.

### forecolor and backcolor
These can be set to a CSS color (like '#FFFFFF' or 'white') to change the default background and foreground colors.

### fonsize
Changes the default fontsize for div or canvas based I/O. The size is in pixels.

## loadWasm(fileName:string)
example:
~~~
await amod.loadWasm("./mycode.wasm")
~~~

You create the .wasm file by compiling your C code using clang.   See the section on C for more information.

## executeC(functionDetails:[])
example
~~~
let result=await amod.executeC(["myfunction", param1])
~~~
executeC takes an array where:
   - the first entry is the name of the C function in the wasm module to call (must be exported, via the --export wasm-ld flag -- see example makefiles)
   - and the next entries are a variable number of parameters to pass to the C function, of type:
      - number - converted to int32 or float64 as appropriate
      - string - converted to a an index (ptr) into a module Memory 
      - URL - the url contents are loaded into module Memory, and two C parameters are generated - index (pointer) to the memory, and length
      - Uint8Array - the array is loaded into module memory, and two parameters are generated - index (pointer) to the memory, and length

executeC returns the value returned by the C function that was called.  As well int and float, strings and structs (or blocks of memory) can be returned.   

More details can be found in examples/function-calls

## Advanced - Accessing Data in the Web Assembly Memory
You probably will not need to use these functions, **executeC()** will convert your parameters for you.  But if you return or want to pass in more complicated structs, you might need to.   The source in source/twr-wasm-ts/canvas.ts shows how these are used.
~~~
async putString(sin:string)      // returns index into WebAssembly.Memory
async putU8(src:Uint8Array)      // returns index into WebAssembly.Memory
async fetchAndPutURL(fnin:URL)   // returns index into WebAssembly.Memory

getLong(idx:number): number 
getShort(idx:number): number 
getString(strIndex:number, len?:number): string 
getU8Arr(idx:number): Uint8Array 
getU32Arr(idx:number): Uint32Array 
~~~

# C API Overview
twr.a is the tiny-wasm-runtime static library that provides C APIs your C code can use.  They fall into these catagories:
   - a subset of stdlib, like printf and strcpy
   - conole I/O for streamed (tty) or terminal I/O
   - Draw 2D APIs allow drawing to a canvas
   - General functions.  Example: twr_wasm_sleep
   - twr_bigint -- this C bigint implementation is used internally by the float-ascii conversions. But you can use it as well.  For documentation, see [my github twr_bigint](https://github.com/twiddlingbits/twr-bigint)

A subset of the standard C runtime is implemented.  The source for these use the "twr_" function prefix (for example, twr_printf).  These also have standard C runtime names defined (for example, printf is defined in the usual stdio.h).  

The subset of implemented std c lib functions can be found in the tiny-wasm-runtime/include folder.

All of the available twr-crt functions can be found at:
   - \tiny-wasm-runtime\include\twr-crt.h

There are some wasm specific C APIs.   These are used by the typescript APIS, and generally don't need to be called directly. These are found at
   - \tiny-wasm-runtime\include\twr-wasm.h
  

## Passing strings, byte arrays, etc
The WebAssembly module provided in a browser will only pass numbers to and from C functions or Javascript functions.  This means if you use twrWasmModule.executeC() to call a C function, and pass integers or floats as arguments, they will work as expected.  But if you pass a string, byte array, or the contents or a URL, twrWasmModule will allocate memory in your WebAssembly.Memory (using twr_malloc), copy the string (or other byte array or URL contents) into this memory, and pass the memory index to your C code. If a byte array or a URL contents is passed, your C function will receive a pointer to the data as the first argument, and a length as the second argument. As similar mechanism is used for return values.

Some module functions (such as getString) take or return an "index:number".  Here index means an index into WebAssembly.Memory.  As far as your C code is concerned, this is a pointer.

See the example "function-calls".


## General functions

### blocking key input
These functions are for input.  They are calling the stdio IoConsole -- see the IoConsole section for more advanced input/output.
~~~
int twr_getchar();
char* twr_gets(char* buffer);
~~~

### debug print
The following is useful for printing debug messages to the browser console from your C code
~~~
#define twr_wasm_dbg_printf(...) io_printf(twr_wasm_get_debugcon(), __VA_ARGS__)
~~~

### sleep
sleep is a traditional blocking sleep function:
~~~
void twr_wasm_sleep(int ms);
~~~

### stdlib extra
There are a few extra 'stdlib' type functions:
~~~
double twr_atod(const char* str);
void twr_dtoa(char* buffer, int sizeInBytes, double value, int max_precision);
void twr_strhorizflip(char * buffer, int n);
#define __min(x, y) twr_minint(x, y)
#define __max(x, y) twr_maxint(x, y)
void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args);
~~~

### advanced input/output
When using functions like printf, the output or input will direct to stdio.  Stdio is set as descried elsewhere in this doc (based on the div or canvas you create in your HTML doc).  Internally stdio is managed via the use of struct IoConsole.  You don't generally need to worry about it, but there are some functions for more advanced use cases:
~~~
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon();
void twr_set_stdio_con(struct IoConsole *setto);
struct IoConsole * twr_get_stdio_con();
~~~

## Console I/O
See tiny-wasm-runtime\include\twr-io.h

C character based input/output is abstracted by:

~~~
struct IoConsole
~~~

Consoles can be "tty" aka "streamed", or they can be "windowed" (aka a "terminal").

Windowed consoles allow text to be placed in assigned positions in the 'twr_iocanvas'.  They also support very chunky (low res) graphics.  Each character cell can be used as a 2x3 graphic array.   See the example 'stdio-canvas'.

There are four consoles that generally exist in the tiny-wasm-runtime world:
   1. null - goes to the preverbal bit bucket
   2. debug - output only.  Goes to the Web Browser debug console.
   3. div - streamed input/output to a \<div> tag
   3. canvas - streamed or windowed input/output to a \<canvas> tag.  You can specify the width and height by the number of characters.  For example, 80X40.  The font is fixed width courier, but you can change the size (see twrWasmModule constructor options)

 stdio is automatically set as follows:
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
struct IoConsole* twr_wasm_get_windowcon();

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

## Draw 2D functions
see the maze example, and the source at source/twr-wasm-c/draw2d.c

To draw:
   - call start_draw_sequence()
   - call draw comands, like d2d_fillrect()
   - call end_draw_sequence()

No actuall drawing will happen until you call end_draw_sequence().  This will take the batch of draws, and send them over to the Javascript Main thread for execution.   By batching the calls, performance is improved since the transtion from a worker thread to a Javascript Main thread is not fast.

The current draw commands are pretty basic.  I plan to add more full support for Canvas APIs before 1.0.

~~~
struct d2d_draw_seq* start_draw_sequence();
void end_draw_sequence(struct d2d_draw_seq* ds);

void d2d_fillrect(struct d2d_draw_seq* ds, short x, short y, short w, short h);
void d2d_hvline(struct d2d_draw_seq* ds, short x1, short y1, short x2, short y2);
void d2d_text_fill(struct d2d_draw_seq* ds, short x, short y, unsigned long text_color, unsigned long back_color, const char* str, int str_len);
void d2d_char(struct d2d_draw_seq* ds, short x, short y, char c);
void d2d_setwidth(struct d2d_draw_seq* ds, short width);
void d2d_setdrawcolor(struct d2d_draw_seq* ds, unsigned long color);
~~~

## Overview of steps to integrate your C code with your HTML/JS code
A good way to get your own code up and running is probably to copy one of the tiny-wasm-runtime/examples, get it to build and run, then start modifying it.  

Here are the general steps to integrate your C with Javascript:

1. Compile your C code with clang
   - See GNU Makefile in examples
   - In your clang compile commands you will need to add the tiny-wasm-runtime/include folder with -I YOURPATH/tiny-wasm-runtime/include.  If you installed using npm, then these will be in the node_modules/tiny-wasm-runtime folder.  See the Makefiles in examples for how to add the -I flag.
   - In your clang linker command, you will need to export the C functions used by tiny-wasm-runtime as well as your functions that you wish to call.  Again, see Makefile for examples.
   - In your clang linker command, you will need to link to twr.a

2. On the HTML/JS side you:
   1. access tiny-wasm-runtime "ES" modules in the normal way with "import". 
   2. add a \<div\> named 'twr_iodiv' (there are other options, this is the simplest)
   3. use "new twrWasmModule()", followed by loadWasm(), then executeC().
   4. Alternately, use twrWasmModuleAsync() -- it is basically interchangable with twrWasmModule, but proxies through a worker thread, and adds blocking support

## Memory
WebAssembly.Memory is currently hard coded to 64KiB*10 (640K), with the heap hard coded to 160K.  In the 640K needs to fit twr.a, your code, the heap, and any stack.  To change the memory size, currently, you will have to change the source code.

to change total memory:
   - source/twr-wasm-ts/twrmod.ts  - search for 'initial: 10'
   - source/twr-wasm-ts/twrmodasync.ts - dito
   - makefile | wasm-ld | --max-memory=6553600    

to change heap size:
   - source/twr-crt/malloc.c  -  change the #define for heap size

## Debugging your C code
By default, the web browser debugger will not show C source code.  You will see the Web Assembly instructions.   Although there does appear to be a way to do source code level debuing in a browser debgger using Web Assembly, I have not taken the time yet to figure out how it works.

My method, as of now, is to use C code that is mostly debugged (using someother tool chain with a good source level debugger, like gcc on windows).

Then use:

~~~
#include "twr-wasm.h"

twr_wasm_dbg_printf()
~~~

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

For some of my code development that I am using tiny-wasm-runtime in, I devleop using the browser to run the files without a bundler.  My project doesn't have a huge amount of HTML code, and i have no server side logic.   I use the following:
   - I use VS Code on Windows
   - I added tiny-wasm-runtime as a git submodule to my project, so i can debug using the typescript source
   - I use the VS Code debugger with a launch configured to use Chrome (see below)
   - I don't use a bundler for development.  I just run my code in Chrome from the local filesystem 
   - I don't use a local dev server since my code all runs in the browser from the file system 

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