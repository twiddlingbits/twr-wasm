<h1>stdio-canvas - WebAssembly 'terminal' C Example</h1>
Print and input "Hello World" from a `<canvas>` "terminal" window.

A tiny WebAssembly C "terminal" can be created with input and output direct to a `<canvas>` tag, and you can use it for character I/O with control over where the character appear in the terminal window.

This example will move a string up or down in the terminal window when you press the u or d key. 

- [View stdio-canvas running live](/examples/dist/stdio-canvas/index.html)
- [View stdio-canvas Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)
- For another 'terminal' demo [View tests-user](/examples/dist/tests-user/index.html)

 <img src="../../img/readme-img-terminal.png" width="400">

~~~
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "twr-crt.h"
#include "twr-wasm.h"

/* this twr-wasm C example draws a string in the middle of a windowed console, */
/* and allows the user to move the string up or down with the u or d keys  */

/* see include/twr-io.h for available functions to draw chars to windowed console */

void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str);

void stdio_canvas() {
    struct IoConsoleWindow* iow=(struct IoConsoleWindow*)twr_get_stdio_con();

    if (!(iow->con.header.type&IO_TYPE_WINDOW)) {  // could also use assert here
        twr_conlog("error - expected window console\n");
        return;
    }

    int h, c;
    const char* str="Hello World (press u or d)";
    const char* spc="                          ";

    h=iow->display.height/2;

    while (1) {
        show_str_centered(iow, h,  str);
        c=twr_getc32();
        show_str_centered(iow, h,  spc);   // erase old string
        
        if (c=='u') { 
            h=h-1;
            if (h<0) h=0;
        }
        if (c=='d') {
            h=h+1;
            if (h>=iow->display.height) h=iow->display.height-1;
        }
    }
}

void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str) {
    int strlen=strlen(str);
    int x=(iow->display.width-strlen)/2;

    io_set_cursorxy(iow, x, h);
    io_putstr(&iow->con, str);
}
~~~

~~~
<head>
	<title>stdio-canvas example</title>
</head>
<body>
	<canvas id="twr_iocanvas" tabindex="0"></canvas>

	<script type="module">
		import {twrWasmModuleAsync} from "twr-wasm";
		
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
			 amod.callC(["stdio_canvas"]).then( (r) => { 
				console.log("callC returned: "+r);
			}).catch(ex=>{
				console.log("exception in HTML script loadWasm() or callC()\n");
				throw ex;
			});
		});

	</script>
</body>
~~~
