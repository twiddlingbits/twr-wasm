# twr-wasm - a Library for Creating C/C++ Web Assembly Modules
**Version 2.0.6**

twr-wasm is a simple, lightweight and easy to use library for building C/C++ Web Assembly code directly with clang. It solves some common use cases with less work than the more feature rich emscripten. 

twr-wasm is easy to understand, and has some cool features. You can input and print streaming character i/o to a `<div>` tag, use a `<canvas>` element as an ANSI terminal, or use a C/C++ 2D drawing api (that is compatible with JavaScript Canvas APIs) to draw to a `<canvas>` element. You can run blocking C/C++.

twr-wasm allows you to run C/C++ code in a web browser. Legacy code, libraries, full applications, or single functions can be integrated with JavaScript and TypeScript.

twr-wasm is designed to be used with the standard llvm clang compiler and tools.

twr-wasm was previously named tiny-wasm-runtime.

## View C++ Web Assembly Bouncing Ball Demo
[View bouncing balls here](https://twiddlingbits.dev/examples/dist/balls/index.html)

## Full Documentation
The full documentation can be [found here](https://twiddlingbits.dev/docsite/)

## Key Features
   - compile and link C/C++ for use with web assembly using clang directly
   - standard C library, libc++. and purpose built APIs available from C/C++
   - TypeScrpt/JavaScript classes to load WASM modules and call C/C++ functions
   - localization support, UTF-8, and windows-1252 support
   - in C/C++, print and get characters to/from `<div>` tags in your HTML page
   - in C/C++, print and get characters to/from a `<canvas>` based "terminal"
   - in C/C++ use 2D drawing API compatible with JavaScript Canvas
   - in C/C++, use the "blocking loop" pattern and integrate with Javascript's asynchronous event loop

## View Live Demos

| Name | View Live Link | Source Link |
| ---- | -------------- | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](https://twiddlingbits.dev/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) |
| Maze (Win32 C Port) | [View live maze](https://twiddlingbits.dev/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/maze) |
| Input from \<div> | [View square demo](https://twiddlingbits.dev/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-div) |
|Mini-Terminal|[View mini-term demo](https://twiddlingbits.dev/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)|

## Installation
Clone from github, or use `npm install twr-wasm`.  To compile C/C++, install `clang` and `wasm-ld`.

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

With an index.html like the following.  This time we are using twrWasmModuleAsync which integrates blocking C code into Javascript.  twrWasmModuleAsync can also be used to receive key input from a \<div> or \<canvas> tag. 

~~~
<head>
   <title>stdio-div example</title>
</head>
<body>
   <div id="twr_iodiv" style="background-color:LightGray;color:DarkGreen" tabindex="0">Loading... <br></div>

   <script type="module">
      import {twrWasmModuleAsync} from "twr-wasm";

      let amod;

      try {
         amod = new twrWasmModuleAsync();

         document.getElementById("twr_iodiv").innerHTML ="<br>";
         document.getElementById("twr_iodiv").addEventListener("keydown",(ev)=>{amod.keyDownDiv(ev)});

         await amod.loadWasm("./stdio-div.wasm");
         await amod.callC(["stdio_div"]);
}
catch(ex) {
   amod.divLog("unexpected exception");
   throw ex;
}

</script>
</body>
~~~

## Full Documentation
The full documentation can be [found here](https://twiddlingbits.dev/)
