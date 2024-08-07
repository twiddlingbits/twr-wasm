---
title:  Stdio Printf and Input Using a div Tag
description: This C WebAssembly example shows how to printf and get characters to and from an HTML div tag using twr-wasm
---

# stdio-div - Printf and Input Using a div Tag
This simple WebAssembly C program demos inputting and printing characters with a `div` tag.

- [view stdio-div example running live](/examples/dist/stdio-div/index.html)
- [View stdio-div source code](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-div)

## Screen Grab of Square Calculator
 <img src="../../img/readme-img-square.png" width="500">

## C Code

~~~c title="stdio-div.c"
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

      await amod.loadWasm("./stdio-div.wasm");
      await amod.callC(["stdio_div"]);

   </script>
</body>
~~~
