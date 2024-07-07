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
   int i;

   printf("Square Calculator\n");

   while (1) {
      printf("Enter an integer: ");
      twr_mbgets(inbuf);
      i=atoi(inbuf);
      printf("%d squared is %d\n\n",i,i*i);
   }
}
~~~

## HTML Code

We are using `twrWasmModuleAsync` which integrates blocking C code into JavaScript.  `twrWasmModuleAsync` can also be used to receive key input from a `<div>` or `<canvas>` tag. 

~~~html title="index.html"
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
