---
title: Consoles (stdio, stderr, more) with C/C++ WebAssembly
description: Stream characters to a div or canvas tag. Likewise input from stdin. Configure a canvas tag as a terminal-console. With twr-wasm lib.
---

# Consoles with C/C++ WebAssembly<br>stdio, stderr, and more
This section describes how to use twr-wasm in order to:

- create input/output consoles for use by C/C++
- direct stdin/stdout and stderr to a console
- use addressable display and canvas 2D consoles
- use multiple consoles at once

## Quick Example
~~~c title="Hello World"
#include <stdio.h>

void hello() {
    printf("hello world\n");
}
~~~

~~~js title="Using twrConsoleDiv"
<body>
   <div id="console-tag"></div>

   <script type="module">
      import {twrConsoleDiv, twrWasmModule} from "twr-wasm";

      const tag=document.getElementById("console-tag");
      const streamConsole=new twrConsoleDiv(tag); 
      const mod = new twrWasmModule({stdio: streamConsole});
      await mod.loadWasm("./helloworld.wasm");
      await mod.callC(["hello"]);

   </script>
</body>
~~~

~~~js title="Using twr_iodiv Shortcut"
<body>
   <div id="twr_iodiv"></div>

   <script type="module">
      import {twrWasmModule} from "twr-wasm";

      const mod = new twrWasmModule();
      await mod.loadWasm("./helloworld.wasm");
      await mod.callC(["hello"]);

   </script>
</body>
~~~

## Running Examples
| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| stdin and stdout to `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-div) |
|simple "terminal" via `<canvas>`|[View hello world demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)|
|"cli" with a `<canvas>` stdio|[View CLI demo using libc++](/examples/dist/tests-user/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-user)|

## Capabilities
To a Console you can:

- read character streams (type IO_TYPE_CHARREAD)
- write character streams (type IO_TYPE_CHARWRITE)
- position characters, graphics, colors with an addressable display (type IO_TYPE_ADDRESSABLE_DISPLAY)
- draw to a Canvas compatible 2D surface (type IO_TYPE_CANVAS2D)
- receive asynchronous events (type IO_TYPE_EVENTS)   

- Use C statements like `printf` or `cout` to consoles that support type IO_TYPE_CHARWRITE.
- Use C statements like  `getc` or `io_mbgets` to get input from consoles that support IO_TYPE_CHARREAD.
- Use C statments like `io_setc32` or `io_set_cursor` with consoles that support IO_TYPE_ADDRESSABLE_DISPLAY.

Consoles are primarily designed for use by twr-wasm C/C++ modules, but they can also be used by JavaScript/TypeScript.

Although it is common to have a single console, an arbitrary number of consoles can be created, and they can be used by an arbitrary number of twr-wasm C/C++ modules.

Unicode characters are supported by consoles (see [Character Encoding Support with twr-wasm](charencoding.md)).

## Console Classes
Consoles are implemented in TypeScript and run in the JavaScript main thread.  This allows consoles to be shared by multiple wasm modules.

### class twrConsoleDiv
`twrConsoleDiv` streams character input and output to a div tag (supports IO_TYPE_CHARREAD, IO_TYPE_CHARWRITE).

The div tag will expand as you add more text (via printf, etc).

### class twrConsoleTerminal
`twrConsoleTerminal` provides streaming or addressable character input and output.  Uses a canvas tag.  (supports IO_TYPE_CHARREAD, IO_TYPE_CHARWRITE, IO_TYPE_ADDRESSABLE_DISPLAY) 

twrConsoleTerminal is a simple windowed terminal and supports the same streamed output and input features as a does twrConsoleDiv, but also supports x,y coordinates, colors, and other features. The window console supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

As you add more text (via printf, etc), the twrConsoleTerminal will scroll if it becomes full (unlike twrConsoleDiv, which expands)

### class twrConsoleDebug 
`twrConsoleDebug` streamings characters to the browser debug console.  (IO_TYPE_CHARWRITE)

## Shortcuts 
If you add a `<div id="twr_iodiv">` or alternately a `<canvas id="twr_iocanvas">` tag to your HTML, twr-wasm will create the appropriate class for you when you instantiate the class `twrWasmModule` or `twrWasmModuleAsync`.  Use these as an aternative to instantiating the console classes in your JavaScript/TypeScript.

- `<div id="twr_iodiv">` will be used for `stdin` and `stdout` if found.
- `<canvas id="twr_iocanvas">` will be used for `stdin` and `stdout` if it exists and no div found. 
- if neither of the above `<div>` or `<canvas>` is defined in your HTML, and if you have not set `stdio` via the `io` or `stdio` module option, then `stdout` is sent to the debug console in your browser. And `stdin` is not available.

Note that you can also add a `<canvas id="twr_d2dcanvas">` to your HTML to define a canvas to be used by twr-wasm's [2D drawing APIs.](../api/api-c-d2d.md)

## Multiple Consoles with Names
When you instantiate a class `twrWasmModule` or `twrWasmModuleAsync`, you can pass it the module option `io` that is a javascript object containing name-console pairs. For example:

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

In this case, as well as setting stdio and stderr, consoles named "stream1" and "stream2" are available to the C/C++ code.

You can use the module option `stdio` to set stdio.  Alternately, the module option `io` allows you to assign names to multiple consoles for use by the module.  `stdio` and `stderr` are reserved for the indicated purpose, but otherwise you can name your consoles as you like.  There is a twr-wasm C API to access the console: `twr_jscon_from_name`:

~~~c title="Using a Named Console"
struct IoConsole * stream1=twr_jscon_from_name("stream1");
fprintf(stream1, "Hello Stream One!\n");
~~~

A complete example `multi-io` is provided.

## stderr
`stderr` streams to the browser's debug console by default, or can be set with the module `io` option.

## IO Console Docs

Consoles are abstracted by a twr-wasm [IO Consoles](../api/api-c-con.md).

## UTF-8 or Windows-1252
Consoles can support UTF-8 or Windows-1252 character encodings (see [Character Encoding Support with twr-wasm](charencoding.md)).

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

## Reading from a Console
Reading from a console is blocking, and so `twrWasmModuleAsync` must be used to receive keys. See the next section for the needed JavaScript line.

You can get characters with any of these functions:

- `io_mbgets` - get a multibyte string from a console using the current locale character encoding.   Console must support IO_TYPE_CHARREAD.
- `twr_mbgets` - the same as `io_mbgets` with the console set to `stdin`.
- `io_mbgetc` - get a multibyte character from an IoConsole (like `stdin`) using the current locale character encoding
- `getc` (sames as `fgetc`) - get a single byte from a FILE * (IoConsole) -- returning ASCII or extended ASCII (window-1252 encoding)
- `io_getc32` - gets a 32 bit unicode code point from an IoConsole (which must support IO_TYPE_CHARREAD)

## JavaScript needed for char input
 `twrWasmModuleAsync` must be used to receive keys from stdin.  In addition, you should add a line like the following to your JavaScript for key input to work:


~~~js
yourDivOrCanvasElement.addEventListener("keydown",(ev)=>{yourConsoleClassInstance.keyDown(ev)});
~~~

You likely want a line like this to automatically set the focus to the div or canvas element (so the user doesn't have to click on the element to manually set focus.  Key events are sent to the element with focus.):

~~~js
yourDivOrCanvasElement.focus();
~~~

You will also need to set the tabindex attribute in your div tag like this to enable key events:

~~~html
<div id="twr_iodiv" tabindex="0"></div>
~~~

See the stdio-div, stdio-canvas, and multi-io examples.

## Sending asyncronous  events to Wasm functions
Note that this section describes blocking input.  As an alternative, you can send events (keyboard, mouse, timer, etc) to a non-blocking C function from JavaScript using `callC`.  See the `balls` or `pong` examples.



