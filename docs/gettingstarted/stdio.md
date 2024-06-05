<h1>Stdio</h1>

<h2>Use div or canvas</h2>
Standard input and output can be directed to a `<div>` or to a `<canvas>` HTML tag.  A `<div>` is used for streamed character input and output, and a `<canvas>` is used for streaming to windowed input and output.  In the windowed mode, the position of characters in a "terminal" style window can be specified.

- `<div id="twr_iodiv">` will be used for `stdin` and `stdout` if found.
- `<canvas id="twr_iocanvas">` will be used for `stdin` and `stdout` if it exists and no div found. 
- if neither of the above `<div>` or `<canvas>` is defined in your HTML, then `stdout` is sent to the debug console in your browser. And `stdin` is not available.
- If you use `twrWasmModule` options, a fourth `null` options is available.

Unicode characters and symbols are supported. 

The windows console also supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

`stderr` streams to the browser's debug console.

<h2>Examples</h2>

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| char in/out with `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-div) |
|"terminal" in/out with a `<canvas>`|[View mini-term demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-canvas)|


<h2>IO Console Docs</h2>

See [IO Consoles](../api/api-c-con.md) for console `io_` functions available.

<h2>UTF-8 or Windows-1252</h2>
Stdin and stdout can support UTF-8 or Windows-1252 (see [localization](../api/api-localization.md))

<h2>stdout</h2>

In addition to the IO Console functions referenced above, you can use a number of standard C functions to output to div or canvas attached to `stdout`:
~~~
printf, vprintf, puts, putchar, snprintf, sprintf,  vsnprintf, vasprintf
~~~

<h2>stdout or stderr</h2>

`#include <stdio.h>` to access `stdout`, `stdin`, `stderr`, and `FILE`.

You can use these functions to output to the standard library defines `stderr` or `stdout`:
~~~
fputc, putc, vfprintf, fprintf, fwrite
~~~

Note that when characters are sent to the browser console using `stderr` they will not render to the console until a newline, return, or ASCII 03 (End-of-Text) is sent.

For example:
~~~
#include <stdio.h>

fprintf(stderr, "hello over there in browser debug console land\n");
~~~

A more common method to send output to the debug console is to use `twr_conlog`. See [General C API Section](../api/api-c-general.md).

<h2>stdin</h2>

You can get characters from the standard C define `stdin` with these functions:

- `io_mbgets` - get a multibyte string from a console using the current locale character encoding
- `twr_mbgets` - similar to `io_mbgets`, except always gets a multibyte locale format string from stdin.
- `io_mbgetc` - get a multibyte character from an IOConsole (like `stdin`) using the current locale character encoding
- `getc` (sames as `fgetc`) - get a single byte from a FILE * (IOConsole) -- returning ASCII or extended ASCII (window-1252 encoding)
- `io_getc32` - gets a 32 bit unicode code point from an IOConsole (which currently needs to be stdin)


Reading from `stdin` is blocking, and so `twrWasmModuleAsync` must be used to receive keys from stdin.

<h2>Javascript needed for char input</h2>
You should add a line like the following to your Javascript for stdin to work:

for `twr_iodiv`
~~~
document.getElementById("twr_iodiv").addEventListener("keydown",(ev)=>{amod.keyDownDiv(ev)});
~~~

for `twr_iocanvas`
~~~
document.getElementById("twr_iocanvas").addEventListener("keydown",(ev)=>{amod.keyDownCanvas(ev)});
~~~

You likely want a line like this to set the focus to the div or canvas so the user doesn't have to click on it:

~~~
document.getElementById("twr_iocanvas").focus();
~~~

You will also need to set the tabindex attribute in your div tag like this:

~~~
<div id="twr_iodiv" tabindex="0"></div>
~~~

See the stdio-div and stdio-canvas examples.

Note that this section describes blocking input using stdin.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from Javascript using `callC`.



