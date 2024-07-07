---
title: WebAssembly Example of a Terminal Using a Canvas Tag
description: This WebAssembly C example demos a character "terminal" with input and output direct to a <canvas> tag using twr-wasm
---

# stdio-canvas - Terminal Using a Canvas Tag
A simple ANSI WebAssembly C "terminal" is created with input and output directed to an HTML `<canvas>` tag.

This example will move a string up or down in the terminal window when you press the u or d or arrow keys. 

This example also draws a graphic box around the terminal window.

- [View stdio-canvas example running live](/examples/dist/stdio-canvas/index.html)
- [View stdio-canvas source code](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)
- For another 'terminal' demo [View tests-user](/examples/dist/tests-user/index.html)

## Screen Grab of Terminal 
<img src="../../img/readme-img-terminal.png" width="500">

## C Code
~~~c title="stdio-canvas.c"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <locale.h>
#include "twr-crt.h"

/* this twr-wasm C example draws a utf-8 string in the middle of a windowed console, */
/* and allows the user to move the string up or down with the u, d or arrow keys */

/* see include/twr-io.h for available functions to draw chars to windowed console */

void draw_outline(struct IoConsoleWindow* iow);
void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str);

void stdio_canvas() {
    struct IoConsoleWindow* iow=(struct IoConsoleWindow*)twr_get_stdio_con();

    assert(iow->con.header.type&IO_TYPE_WINDOW);

    setlocale(LC_ALL, "");  // set user default locale, which is always UTF-8.  This is here to turn on UTF-8.

    int h;
    const char* str="Hello World (press u, d, ↑, or ↓)";  // arrows are UTF-8 multibyte
    const char* spc="                                 ";
    char inbuf[6];  // UTF-8 should be max 4 bytes plus string ending 0

    h=iow->display.height/2;

   draw_outline(iow);

    while (1) {
      show_str_centered(iow, h,  str);
      io_mbgetc(stdin, inbuf); // also see twr_getc32 documentation
      show_str_centered(iow, h,  spc);   // erase old string

      if (strcmp(inbuf,"u")==0 || strcmp(inbuf,"↑")==0) {   // arrows are multibyte UTF-8.
         h=h-1;
         if (h<1) h=1;  // border I drew is in the 0 position
      }
      if (strcmp(inbuf,"d")==0 || strcmp(inbuf,"↓")==0) {
         h=h+1;
         if (h>=(iow->display.height-1)) h=iow->display.height-2;  // border I drew is in the height-1 position
      }
   }
}

void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str) {
    int len=twr_mbslen_l(str, twr_get_current_locale());
    int x=(iow->display.width-len)/2;
    io_set_cursorxy(iow, x, h);
    io_putstr(&iow->con, str);
}

void draw_outline(struct IoConsoleWindow* iow) {
   const int w=iow->display.width*2;   // graphic cells are 2x3
   const int h=iow->display.height*3;
   unsigned long fgcolor, bgcolor;

   io_begin_draw(&iow->con);

   io_get_colors(&iow->con, &fgcolor, &bgcolor);
   io_set_colors(&iow->con, 0x000000, bgcolor);  // draw in black

   for (int i=0; i<w; i++) {
      io_setreset(iow, i, 0, true);
      io_setreset(iow, i, h-1, true);
   }

   for (int i=0; i<h; i++) {
      io_setreset(iow, 0, i, true);
      io_setreset(iow, w-1, i, true);
   }

   io_set_colors(&iow->con, fgcolor, bgcolor);  // restore

   io_end_draw(&iow->con);

}
~~~

## HTML Code

~~~html title="index.html"
<!doctype html>
<html>
<head>
   <title>stdio-canvas example</title>
</head>
<body>
   <canvas id="twr_iocanvas" tabindex="0"></canvas>

   <!-- importmap used when un-bundled -->
   <script type="importmap">
      {
         "imports": {
         "twr-wasm": "../../lib-js/index.js"
         }
      }
   </script>

   <script type="module">
      import {twrWasmModuleAsync} from "twr-wasm";
      
      try {
         const amod = new twrWasmModuleAsync({windim:[50,20], forecolor:"beige", backcolor:"DarkOliveGreen", fontsize:18});

         document.getElementById("twr_iocanvas").focus();
         document.getElementById("twr_iocanvas").addEventListener("keydown",(ev)=>{amod.keyDownCanvas(ev)});

         await amod.loadWasm("./stdio-canvas.wasm");
         const r=await amod.callC(["stdio_canvas"]);
         console.log("callC returned: "+r);
      }
      catch(ex) {
         console.log("unexpected exception");
         throw ex;
      }

   </script>
</body>
</html>
 
~~~
