# Easier C/C++ WebAssembly
**Version 2.5.0**

twr-wasm is a simple, lightweight and easy to use library for building C/C++ WebAssembly code directly with clang. Run C/C++ code in a web browser. Legacy code, libraries, full applications, or single functions can be integrated with JavaScript and TypeScript. twr-wam solves some common use cases with less work than the more feature rich emscripten. 

**Key Features:**

- build `.wasm` modules using C/C++ using clang directly (no wrapper)
- from JavaScript load `.wasm` modules, call C/C++ functions, and access wasm memory
- comprehensive console support for `stdin`, `stdio`, and `stderr`.
  - in C/C++, print and get characters to/from `<div>` tags in your HTML page
  - in C/C++, print and get characters to/from a `<canvas>` based "terminal"
  - localization support, UTF-8, and windows-1252 support
- the optional TypeScript `class twrWasmModuleAsync` can be used to:
  - integrate a C/C++ Read-Eval-Print Loop (REPL) with JavaScript
  - integrate a C/C++ CLI or Shell with JavaScript
  - In JavaScript `await` on blocking/synchronous C/C++ functions. 
- 2D drawing API for C/C++ compatible with JavaScript Canvas
- audio playback APIs for C/C++
- create your own C/C++ APIs using TypeScript by extending `class twrLibrary`
- standard C library optimized for WebAssembly
- libc++ built for WebAssembly
- comprehensive examples and documentation

## Live WebAssembly Examples and Source

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](https://twiddlingbits.dev/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) |
| Maze Gen/Solve (Win32 C Port) | [View live maze](https://twiddlingbits.dev/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/maze) |
| Input/Output with `<div>` | [View square demo](https://twiddlingbits.dev/examples/dist/divcon/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/divcon) |
|I/O to terminal with `<canvas>`|[View demo](https://twiddlingbits.dev/examples/dist/terminal/index.html) |[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/terminal) |
|CLI using libc++ and `<canvas>`)| [View console](https://twiddlingbits.dev/examples/dist/tests-user/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-user) |

## Full Documentation
The full documentation can be [found here](https://twiddlingbits.dev/docsite/)

## Installation
`npm install twr-wasm`. 

For details see https://twiddlingbits.dev/docsite/gettingstarted/installation/

## Hello World
Here is the simplest twr-wasm example.

C code:

~~~
#include <stdio.h>

void hello() {
   printf("hello world\n");
}
~~~

index.html:
~~~
<head>
   <title>Hello World</title>
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
~~~



## Simple \<div> i/o
I/O can be directed to or from a \<div> or a \<canvas> tag.  Here is a simple example using a \<div> for stdio input and output.

 <br>

~~~
#include <stdio.h>
#include <stdlib.h>
#include "twr-crt.h"

void stdio_div() {
   char inbuf[64];
   char *r;
   int i;

   printf("Square Calculator\n");

   while (1) {
      printf("Enter an integer: ");
      r=twr_mbgets(inbuf);  // r is NULL if esc entered.  Otherwise r == inbuf
      if (r) {  
         i=atoi(inbuf);
         printf("%d squared is %d\n\n",i,i*i);
      }
      else {
         printf("\n");
      }
   }
}
~~~

With an index.html like the following.  This time we are using twrWasmModuleAsync which integrates blocking C code into Javascript.  twrWasmModuleAsync can also be used to receive key input from a \<div> or \<canvas> tag. 

~~~
<body>
   <div id="stdioDiv" 
        tabindex="0" 
        style="color: DarkGreen; background-color: LightGray; font-size: 18px;font-family: Arial, sans-serif;" >
        Loading... <br>
   </div>

   <script type="module">
      import {twrWasmModuleAsync, twrConsoleDiv} from "twr-wasm";

      const con = new twrConsoleDiv(document.getElementById("stdioDiv"));
      const amod = new twrWasmModuleAsync({stdio: con});

      // remove 'Loading...'
      document.getElementById("stdioDiv").innerHTML ="<br>"; 
      // send key events to twrConsoleDiv
      document.getElementById("stdioDiv").addEventListener("keydown",(ev)=>{con.keyDown(ev)});

      await amod.loadWasm("./divcon.wasm");
      await amod.callC(["stdio_div"]);

   </script>
</body>
~~~

## Full Documentation
The full documentation can be [found here](https://twiddlingbits.dev/)
