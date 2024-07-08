---
title: Stdio with C/C++ WebAssembly
description: Learn WebAssembly techniques to direct C/C++ stdio to a div or canvas tag by using twr-wasm.
---

# Stdio with C/C++ WebAssembly
This section describes how you can direct C/C++ standard input or output to or from a div or canvas tag in a twr-wasm C/C++ Wasm project.

## Use div or canvas tag
Standard input and output can be directed to a `<div>` or to a `<canvas>` HTML tag.  A `<div>` is used for streamed character input and output, and a `<canvas>` is used for sending characters or simple graphics to windowed input and output.  In the windowed mode, the position of characters in a "terminal" style window can be specified.  In windowed mode, you can use functions that output to stdout or input from stdin, as well as functions that use x,y coordinates, colors, etc.

- `<div id="twr_iodiv">` will be used for `stdin` and `stdout` if found.
- `<canvas id="twr_iocanvas">` will be used for `stdin` and `stdout` if it exists and no div found. 
- if neither of the above `<div>` or `<canvas>` is defined in your HTML, then `stdout` is sent to the debug console in your browser. And `stdin` is not available.
- If you use `twrWasmModule` options, a fourth `null` options is available.

Unicode characters and symbols are supported in `stdout` and `stdin` and windowed i/o (see [localization](../api/api-localization.md)).

The window console also supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

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

## stdout or stderr

`#include <stdio.h>` to access `stdout`, `stdin`, `stderr`, and `FILE`.

FILE is supported for user input and output, and for stderr.  File i/o (to a filesystem) is not currently supported.

You can use these functions to output to the standard library defines `stderr` or `stdout`:
~~~
fputc, putc, vfprintf, fprintf, fwrite
~~~

You can use the IO Console functions referenced above to send to `stdout` and `stderr`.

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

## stdin

You can get characters from the standard C define `stdin` with these functions:

- `io_mbgets` - get a multibyte string from a console using the current locale character encoding
- `twr_mbgets` - similar to `io_mbgets`, except always gets a multibyte locale format string from stdin.
- `io_mbgetc` - get a multibyte character from an IoConsole (like `stdin`) using the current locale character encoding
- `getc` (sames as `fgetc`) - get a single byte from a FILE * (IoConsole) -- returning ASCII or extended ASCII (window-1252 encoding)
- `io_getc32` - gets a 32 bit unicode code point from an IoConsole (which currently needs to be stdin)


Reading from `stdin` is blocking, and so `twrWasmModuleAsync` must be used to receive keys from stdin.

## JavaScript needed for char input
You should add a line like the following to your JavaScript for stdin to work:

for `twr_iodiv`
~~~js
document.getElementById("twr_iodiv").addEventListener("keydown",(ev)=>{amod.keyDownDiv(ev)});
~~~

for `twr_iocanvas`
~~~js
document.getElementById("twr_iocanvas").addEventListener("keydown",(ev)=>{amod.keyDownCanvas(ev)});
~~~

You likely want a line like this to set the focus to the div or canvas so the user doesn't have to click on it:

~~~js
document.getElementById("twr_iocanvas").focus();
~~~

You will also need to set the tabindex attribute in your div tag like this:

~~~html
<div id="twr_iodiv" tabindex="0"></div>
~~~

See the stdio-div and stdio-canvas examples.

Note that this section describes blocking input using stdin.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from JavaScript using `callC`.  See the `balls` example.



