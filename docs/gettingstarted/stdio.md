---
title: Stdio and Consoles with C/C++ WebAssembly
description: Stream stdout characters to a div or canvas tag. Likewise input from stdin. Configure a canvas tag as a terminal-console. With twr-wasm lib.
---

# Stdio and Consoles with C/C++ WebAssembly
This section describes how you can:
- create input/output consoles in JavaScript/TypeScript for use with twr-wasm C/C++ modules
- direct stdin/stdout and stderr to a console
- use addressable display consoles as a "terminal"
- use multiple consoles at once

Consoles can have a combination of the following capabilities:
- character stream can be read from (type IO_TYPE_CHARREAD)
- character stream can be written to (type IO_TYPE_CHARWRITE)
- addressable character display (type IO_TYPE_ADDRESSABLE_DISPLAY)
- canvas compatible 2D drawing (type IO_TYPE_CANVAS2D)
- asynchronous events (type IO_TYPE_EVENTS)   

Three primary console JavaScript/TypeScript classes are available:
- class twrConsoleDiv - streams character input and output to a div tag (supports IO_TYPE_CHARREAD, IO_TYPE_CHARWRITE) 
- class twrConsoleTerminal - streaming or addressable character input and output.  Uses a canvas tag.  (supports IO_TYPE_CHARREAD, IO_TYPE_CHARWRITE, IO_TYPE_ADDRESSABLE_DISPLAY) 
- class twrConsoleDebug - streamings characters to the browser debug console.  (IO_TYPE_CHARWRITE)

Consoles are primarily designed for use by twr-wasm C/C++ modules, but they can also be used by JavaScript/TypeScript.

Although it is common to have a single console, an arbitrary number of consoles can be created, and they can be used by an arbitrary number of twr-wasm C/C++ modules.

- Use C statements like `printf` or `cout` to consoles that support type IO_TYPE_CHARWRITE.
- Use C statements like  `getc` or `io_mbgets` to get input from consoles that support IO_TYPE_CHARREAD.
- Use C statments like `io_setc32` or `io_set_cursor` with consoles that support IO_TYPE_ADDRESSABLE_DISPLAY.

Unicode characters are supported by consoles (see [Character Encoding Support with twr-wasm](charencoding.md)).

## Quick Example
TODO class example AND div tag example

## twrConsoleDiv vs twrConsoleTerminal
IConsoleTerminal is a simple windowed terminal and supports the same streamed output and input features as a does twrConsoleDiv, but also supports x,y coordinates, colors, and other features. The window console supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

Another difference between a twrConsoleDiv stream and a twrConsoleTerminal stream, is that a twrConsoleDiv will grow as more text is added.  On the other hand, a twrConsoleTerminal has a fixed width and height, and additional text will cause a scroll as it fills up the window.

## Shortcut 
If you add a `<div id="twr_iodiv">` or alternately a `<canvas id="twr_iocanvas">` tag to your HTML, twr-wasm will create the appropriate class for you when you instantiate the class `twrWasmModule` or `twrWasmModuleAsync`.  Use these as an aternative to instantiating the console classes in your JavaScript/TypeScript.

- `<div id="twr_iodiv">` will be used for `stdin` and `stdout` if found.
- `<canvas id="twr_iocanvas">` will be used for `stdin` and `stdout` if it exists and no div found. 
- if neither of the above `<div>` or `<canvas>` is defined in your HTML, then `stdout` is sent to the debug console in your browser. And `stdin` is not available.

Note that you can also add a `<canvas id="twr_d2dcanvas">` to your HTML to define a canvas to be used by twr-wasm's [2D drawing APIs.](../api/api-c-d2d.md)

## Console Names
When you instantiate a class `twrWasmModule` or `twrWasmModuleAsync`, you can pass it a named list of consoles. For example:

~~~js
const stream1Element=document.getElementById("stream1");
const stream2Element=document.getElementById("stream2");

const debug = new twrConsoleDebug();
const stream1 = new twrConsoleDiv(stream1Element);
const stream2 = new twrConsoleDiv(stream2Element);

stream1Element.addEventListener("keydown",(ev)=>{stream1.keyDown(ev)});
stream2Element.addEventListener("keydown",(ev)=>{stream2.keyDown(ev)});

// setting stdio and/or stderr to a debug console isn't necessary since that will be the default if stdio or stderr is not set.
// but here to show how to set stdio and/or stderr.  They can be set to any console.
const amod = new twrWasmModuleAsync( {io:{stdio: debug, stderr: debug, stream1: stream1, stream2: stream2}} );
const mod = new twrWasmModule( {io:{stdio: debug, stderr: debug, stream1: stream1, stream2: stream2}} );
~~~

In this case as well as setting stdio and stderr, consoles named "stream1" and "stream2" are available to the C/C++ code.

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
`Stdin` and `stdout` can support UTF-8 or Windows-1252 character encodings (see [Character Encoding Support with twr-wasm](charencoding.md)).

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


- `io_mbgets` - get a multibyte string from a console using the current locale character encoding.   Console must support IO_TYPE_CHARREAD.
- `twr_mbgets` - the same as `io_mbgets` with the console set to `stdin`.
- `io_mbgetc` - get a multibyte character from an IoConsole (like `stdin`) using the current locale character encoding
- `getc` (sames as `fgetc`) - get a single byte from a FILE * (IoConsole) -- returning ASCII or extended ASCII (window-1252 encoding)
- `io_getc32` - gets a 32 bit unicode code point from an IoConsole (which must support IO_TYPE_CHARREAD)

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



