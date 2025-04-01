---
title:  Stdio Printf and Input Using a div Tag
description: This C WebAssembly example shows how to implement a Read-Eval-Print Loop (REPL) in twr-wasm
---

# divcon - Printf and Input Using a `div` Tag
## What It Does
This example inputs a number, squares it, and prints the result using standard C library functions.
  
The divcon example demos:

* A Read-Eval-Print Loop (REPL) 
* using twr-wasm `class twrWasmModuleAsync` to `await` on blocking C code
* getting and print characters to a `div` tag using twr-wasm `class twrConsoleDiv`

## Running Examples and Source:

- [view divcon example running live](/examples/dist/divcon/index.html)
- [View divcon source code](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/divcon)

## Screen Grab of Square Calculator
 <img src="../../img/readme-img-square.png" width="500">

## C Code

~~~c title="divcon.c"
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

## HTML Code

We are using `twrWasmModuleAsync` which integrates blocking C code into JavaScript.  `twrWasmModuleAsync` can also be used to receive key input from a `<div>` or `<canvas>` tag. 

~~~html title="index.html"
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
