---
title: Stdio with C/C++ WebAssembly
description: Stream stdout characters to a div or canvas tag. Likewise input from stdin. Configure a canvas tag as a terminal-console. With twr-wasm lib.
---

# Stdio with C/C++ WebAssembly
This section describes how you can direct C/C++ standard input or output to or from a div or canvas tag in a twr-wasm C/C++ Wasm project.

## Use div or canvas tag
Standard input and output can be directed to a `<div>` or to a `<canvas>` HTML tag.  Using a `<div>` is a simple way to display the output of a `printf`, or to get input from `getc` (using traditional standard library blocking input). 

A `<canvas>` tag can be used by twr-wasm to create a simple ANSI style terminal or console.  This windowed terminal supports the same streamed output and input features as a does a div tag, but also supports x,y coordinates, colors, and other features. The window console supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

Another difference between a div stream and a canvas stream, is that a div tag will grow as more text is added.  On the other hand, a canvas tag has a fixed width and height, and additional text will cause a scroll as it fills up the window.

Unicode characters are supported by `stdout` and `stdin` (see [Character Encoding Support with twr-wasm](charencoding.md)).

## div or canvas tag discovery order
If you wish to use a div or canvas tag for stdio when using twr-wasm, in your HTML file add a `<div id="twr_iodiv">` or alternately a `<canvas id="twr_iocanvas">` tag.

- `<div id="twr_iodiv">` will be used for `stdin` and `stdout` if found.
- `<canvas id="twr_iocanvas">` will be used for `stdin` and `stdout` if it exists and no div found. 
- if neither of the above `<div>` or `<canvas>` is defined in your HTML, then `stdout` is sent to the debug console in your browser. And `stdin` is not available.

Note that you can also add a `<canvas id="twr_d2dcanvas">` to your HTML to define a canvas to be used by twr-wasm's [2D drawing APIs.](../api/api-c-d2d.md)

## stderr
`stderr` streams to the browser's debug console.

## Examples

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| stdin and stdout to `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-div) |
|simple "terminal" via `<canvas>`|[View hello world demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)|
|"cli" with a `<canvas>` stdio|[View CLI demo using libc++](/examples/dist/tests-user/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-user)|

## IO Console Docs

`stdin`,  `stdout`, and `stderr` are abstracted by a twr-wasm [IO Consoles](../api/api-c-con.md).

## UTF-8 or Windows-1252
`Stdin` and `stdout` can support UTF-8 or Windows-1252 character encodings (see [localization](../api/api-localization.md))

## Includes

`#include <stdio.h>` to access `stdout`, `stdin`, `stderr`, and `FILE`.

FILE is supported for user input and output, and for stderr.  File i/o (to a filesystem) is not currently supported.

## stdout and stderr functions
You can use these functions to output to the standard library defines `stderr` or `stdout`:
~~~
fputc, putc, vfprintf, fprintf, fwrite
~~~

You can also use the IO Console functions referenced above to send to `stdout` and `stderr`.

These functions go to stdout:
~~~
printf, vprintf, puts, putchar
~~~

Note that when characters are sent to the browser console using `stderr` they will not render to the console until a newline, return, or ASCII 03 (End-of-Text) is sent.

For example:
~~~c
#include <stdio.h>

fprintf(stderr, "hello over there in browser debug console land\n");
~~~

A more common method to send output to the debug console is to use `twr_conlog`. See [General C API Section](../api/api-c-general.md).

## stdin functions
Reading from `stdin` is blocking, and so `twrWasmModuleAsync` must be used to receive keys from stdin. See the next section for the needed JavaScript line.

You can get characters from `stdin` with any of these functions:

- `io_mbgets` - get a multibyte string from the stdin IoConsole using the current locale character encoding 
- `io_getc32` - gets a 32 bit unicode code point the stdin IoConsole
- `io_mbgetc` - get a single multibyte character from the stdin IoConsole using the current locale character encoding
- `twr_mbgets` - similar to `io_mbgets`,  but assumes `stdin` is the input source
- `getc` (sames as `fgetc`) - get a single byte from a FILE * (struct IoConsole *) -- which should be stdin.  Returning ASCII or extended ASCII (window-1252 encoding).

## JavaScript needed for char input
 `twrWasmModuleAsync` must be used to receive keys from stdin.  In addtion, you should add a line like the following to your JavaScript for stdin to work:

If using `twr_iodiv`
~~~js
document.getElementById("twr_iodiv").addEventListener("keydown",(ev)=>{amod.keyDownDiv(ev)});
~~~

If using `twr_iocanvas`
~~~js
document.getElementById("twr_iocanvas").addEventListener("keydown",(ev)=>{amod.keyDownCanvas(ev)});
~~~

You likely want a line like this to automatically set the focus to the div or canvas element (so the user doesn't have to click on the element to manually set focus.  Key events are sent to the element with focus.):

~~~js
document.getElementById("twr_iocanvas").focus();
~~~

You will also need to set the tabindex attribute in your div tag like this:

~~~html
<div id="twr_iodiv" tabindex="0"></div>
~~~

See the stdio-div and stdio-canvas examples.

## Sending asyncronous  events to Wasm functions
Note that this section describes blocking input using stdin.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from JavaScript using `callC`.  See the `balls` example.



