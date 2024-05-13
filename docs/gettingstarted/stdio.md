<h1>Stdio</h1>

<h2>Use div or canvas</h2>
Standard input and output can be directed to a `<div>` or to a `<canvas>` HTML tag.  A `<div>` is used for streamed character input and output, and a `<canvas>` is used for streaming to windowed input and ouput.  In the windowed mode, the position of characters in a "terminal" style window can be specified.

- `<div id="twr_iodiv">` will be used if found.
- `<canvas id="twr_iocanvas">` will be used if it exists and no div found. 
- if neither of the above `<div>` or `<canvas>` is defined in your HTML, then `stdout` is sent to the debug console in your browser.
- If you use `twrWasmModule` options, a forth `null` options is available

**Examples**

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| char in/out with `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-div) |
|"terminal" in/out with a `<canvas>`|[View mini-term demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-canvas)|

<h2>Functions</h2>
You can use a number of standard C functions to output to div or canvas attached to stdio:
~~~
printf, vprintf, puts, putchar, snprintf, sprintf,  vsnprintf, vasprintf
~~~

In addition, you can use these functions to output to the standard library defines `stderr` or `stdout`:
~~~
fputc, putc, vfprintf, fprintf, fwrite
~~~

Note that when characters are sent to the browser console using `stderr` they will not render to the console until a newline, return, or ASCII 03 (End-of-Text) is sent.

You can get characters from the standard C define `stdin` with these functions:
~~~
fgetc, getc

or

int twr_getchar();
char* twr_gets(char* buffer);
~~~

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

Note that this section describes blocking input using stdin.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from Javascript using `callC`.


