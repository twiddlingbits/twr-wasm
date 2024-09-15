---
title: Consoles with C/C++ WebAssembly (stdio, stderr, more)
description: Stream characters to a div or canvas tag. Input from stdin. Configure a canvas tag as a terminal-console. With twr-wasm lib.
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
| stdin and stdout to `<div>` | [View square demo](/examples/dist/divcon/index.html) | [Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/divcon) |
|simple "terminal" via `<canvas>`|[View hello world demo](/examples/dist/terminal/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/terminal)|
|"cli" with a `<canvas>` stdio|[View CLI demo using libc++](/examples/dist/tests-user/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/tests-user)|
|Multiple Consoles, including Canvas2D|[View multi-io demo](../examples/examples-multi-io.md)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/multi-io)|

## Capabilities
With a Console you can:

- read character streams (Use C statements like  [`getc`](../api/api-c-general.md#getc) or [`io_mbgets`](../api/api-c-con.md#io_mbgets))
- write character streams (use C statements like `printf` or `cout`)
- position characters, graphics, colors with an addressable display (Use C statements like [`io_setc32`](../api/api-c-con.md#io_setc32) or [`io_set_cursor`](../api/api-c-con.md#io_set_cursor)).
- draw to a Canvas compatible 2D surface (Use C statements like [`d2d_fillrect`](../api/api-c-d2d.md)).

Consoles are primarily designed for use by twr-wasm C/C++ modules, but they can also be used by JavaScript/TypeScript.

Although it is common to have a single console, an arbitrary number of consoles can be created, and they can be used by an arbitrary number of twr-wasm C/C++ modules.

Unicode characters are supported by consoles (see [Character Encoding Support with twr-wasm](charencoding.md)).

## Tag Shortcuts 
If you add a `<div id="twr_iodiv">`, a `<canvas id="twr_iocanvas">`, or a `<canvas id="twr_d2dcanvas">` tag to your HTML, twr-wasm will create the appropriate class for you when you instantiate the class `twrWasmModule` or `twrWasmModuleAsync`.  Use these tag shortcuts as an aternative to instantiating the console classes in your JavaScript/TypeScript.

- `<div id="twr_iodiv">` will be used to create a `twrConsoleDiv` as `stdio`
- `<canvas id="twr_iocanvas">` will be used to create a `twrConsoleTerminal` as `stdio`. 
- `<canvas id="twr_d2dcanvas">` will be used to create a `twrConsoleCanvas` as `std2d` -- the default 2D drawing surface.  See [2D drawing APIs.](../api/api-c-d2d.md)

If neither of the above `<div>` or `<canvas>` is defined in your HTML, and if you [have not set `stdio` via the `io` or `stdio` module options](#multiple-consoles-with-names), then `stdout` is sent to the debug console in your browser. And `stdin` is not available.

## Console Classes
Consoles are implemented in TypeScript and run in the JavaScript main thread.  This allows consoles to be shared by multiple wasm modules.

For simple cases, when you use the tag shortcuts, you won't need to use these console classes directly.  For more bespoke cases, they will come in handy. For details on console classes, see the [TypeScript/JavaScript API reference](../api/api-ts-consoles.md)

These conosle classes are available in twr-wasm:  

- [`twrConsoleDiv`](../api/api-ts-consoles.md#class-twrconsolediv) streams character input and output to a div tag 
- [`twrConsoleTerminal`](../api/api-ts-consoles.md#class-twrconsoleterminal) provides streaming or addressable character input and output using a canvas tag.
- [`twrConsoleDebug`](../api/api-ts-consoles.md#class-twrconsoledebug) streamings characters to the browser debug console.
- [`twrConsoleCanvas`](../api/api-ts-consoles.md#class-twrconsolecanvas) creates a 2D drawing surface that the Canvas compatible [2d drawing APIs](../api/api-c-d2d.md) can be used with.

## Multiple Consoles with Names
When you instantiate a class `twrWasmModule` or `twrWasmModuleAsync`, you can pass it the module option `io` -- a javascript object containing name-console attributes. Your C/C++ code can then retrieve a console by name.  This is described in more detail the [TypeScript/JavaScript API Reference.](../api/api-ts-modules.md#io-option-multiple-consoles-with-names)

Also see the [multi-io example](../examples/examples-multi-io.md).

## Setting stdio and stderr
`stdio` can be defined automatically if you use a Tag Shortcut. `stderr` streams to the browser's debug console by default. Both can be set to a specific console [with the module `io` option.](../api/api-ts-modules.md#io-option-multiple-consoles-with-names)

For example, either of these will set `stdio` to a streaming `div` console:

~~~c
const tag=document.getElementById("console-tag");
const streamConsole=new twrConsoleDiv(tag);

const mod = new twrWasmModule({stdio: streamConsole});
const mod = new twrWasmModule({ io: {stdio: streamConsole} });
~~~

This option would send stderr and stdio to the same console:

~~~c
const mod = new twrWasmModule({ io: 
   {stdio: streamConsole, stderr: streamConsole} 
});
~~~

## UTF-8 or Windows-1252
Consoles can support UTF-8 or Windows-1252 character encodings (see [Character Encoding Support with twr-wasm](charencoding.md)).

## C Access To Consoles
### io_functions
`io_functions` [are available to operate on ](../api/api-c-con.md) all character based Consoles.

### d2d_functions
`d2d_functions` [are available to operate on](../api/api-c-d2d.md) Canvas 2D Consoles.

### Reading from a Console
Reading from a console is blocking, and so [`twrWasmModuleAsync` must be used to receive keys.](../api/api-ts-modules.md#class-twrwasmmoduleasync) There are some specific requirements to note in the `twrWasmModuleAsync` API docs.

You can get characters with any of these functions:

- `io_mbgets` - get a multibyte string from a console using the current locale character encoding.   Console must support IO_TYPE_CHARREAD.
- `twr_mbgets` - the same as `io_mbgets` with the console set to `stdin`.
- `io_mbgetc` - get a multibyte character from an `twr_ioconsole_t *` (aka `FILE *`) like `stdin` using the current locale character encoding
- `getc` (same as `fgetc`) - get a single byte from a `FILE *` (aka `twr_ioconsole_t *`) -- returning ASCII or extended ASCII (window-1252 encoding)
- `io_getc32` - gets a 32 bit unicode code point from an `twr_ioconsole_t *` (which must support IO_TYPE_CHARREAD)

### Standard C Library Functions
Many of the common standard C library functions, plus twr-wasm specific functions, are available to stream characters to and from the standard input and output console that supports character streaming (most do).

In C, a console is represented by `twr_ioconsole_t`.  In addition, `FILE` is the same as a `twr_ioconsole_t` (`typedef twr_ioconsole_t FILE`).  `stdout`, `stdin`, `stderr` are all consoles.

`#include <stdio.h>` to access `stdout`, `stdin`, `stderr`, and `FILE`.

`FILE` is supported for user input and output, and for stderr.  `FILE` as filesystem I/O is not currently supported.

#### stdout and stderr functions
You can use these functions to output to the standard library defines `stderr` or `stdout`:
~~~
fputc, putc, vfprintf, fprintf, fwrite
~~~

These functions go to `stdout`:
~~~
printf, vprintf, puts, putchar
~~~

Note that when characters are sent to the browser console using `stderr` they will not render to the console until a newline, return, or ASCII 03 (End-of-Text) is sent.

For example:
~~~c
#include <stdio.h>

fprintf(stderr, "hello over there in browser debug console land\n");
~~~

A more common method to send output to the debug console is to use `twr_conlog`. See [General C API Section](../api/api-c-general.md#twr_conlog).




