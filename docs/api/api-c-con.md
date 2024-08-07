---
title: WebAssembly C Character Console  API
description: twr-wasm provides a streamed and addressable API for character I/O.  This API is used by stdin, stdout, and stderr, as well as a  Terminal.
---

# WebAssembly Character Console API
twr-wasm for WebAssembly provides [Consoles for abstracting interactive user I/O](../gettingstarted/stdio.md).  Character and graphic 2D draw consoles exist.  This section covers streaming and addressable character console APIs as enabled by twrConsoleDebug, twrConsoleTerminal, twrConsoleDiv.

Also see [Consoles in Getting Started](../gettingstarted/stdio.md)

## Examples

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
|"terminal" in/out with a `<canvas>`|[View mini-term demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)|

## stderr, stdin, stdout
stdio.h defines `stdin`, `stdout`, `stderr` as explained here: [Consoles in Getting Started](../gettingstarted/stdio.md)

In C, consoles are represented by a `struct IoConsole`. 

stdio.h also defines `FILE` like this:
~~~
typedef struct IoConsole FILE; 
~~~

from `<stdio.h>`:
~~~
#define stderr (FILE *)(twr_get_stderr_con())
#define stdin (FILE *)(twr_get_stdio_con())
#define stdout (FILE *)(twr_get_stdio_con())
~~~

## Getting a Console
### stdin, stdout, stderr
`stdin`, `stdout`, and `stderr` are defined in `<stdio.h>`.

### twr_get_console
This function will retrieve a console by its name.  The standard names are `stdio`, `stderr`, and `std2d`.  In addition, any named console that was passed to a module using the `io` option can be retrieved with this function.

See [io doc](../api/api-typescript.md#io-option-multiple-consoles-with-names).

See the [multi-io example](../examples/examples-multi-io.md).

~~~
#include "twr-io.h"

struct IoConsole* twr_get_console(const char* name)
~~~

### io_nullcon
Returns an IoConsole that goes to the bit bucket.  io_getc32 will return 0.

~~~
#include "twr-io.h"

struct IoConsole* io_nullcon(void);
~~~

### twr_debugcon
This function has been removed.  Use `stderr` or `twr_conlog`.

~~~c
#include "twr-wasm.h"

twr_conlog("hello 99 in hex: %x", 99);
~~~

or

~~~c
#include <stdio.h>

fprintf(stderr, "hello over there in browser debug console land\n");
~~~

### twr_divcon
This function has been removed.

### twr_windowcon
This function has been removed.

## IO Console Functions

### io_cls
For addressable display consoles only.

Clears the screen.  That is, all character cells in the console are set to a space, their colors are reset to the current default colors (see `io_set_colors`).

~~~
#include <twr_io.h>

void io_cls(struct IoConsoleWindow* iow);
~~~

### io_getc32
Waits for the user to hit enter and then returns a unicode code point. 

To return characters encoded with the current locale, see `io_mbgetc`

~~~
#include <twr_io.h>

int io_getc32(struct IoConsole* io);
~~~

### io_get_colors
For addressable display consoles only.

Gets the current default foreground and background colors.  These colors are used by an new text updates.

The color format is a 24 bit int as RGB.

~~~
#include <twr_io.h>

void io_get_colors(struct IoConsole* io, unsigned long *foreground, unsigned long *background);
~~~

### io_get_cursor
Returns an integer of the current cursor position.  The cursor is where the next `io_putc` is going to go. 

For addressable display consoles, the cursor position ranges from [0, width*height-1], inclusive.

~~~c
#include <twr_io.h>

int io_get_cursor(struct IoConsole* io);
~~~

### io_get_prop
Given a string key (name) of a property, returns its integer value.  The available properties varies by console type.
~~~c
#include <twr_io.h>

int io_get_prop(struct IoConsole* io, const char* key)
~~~
All consoles support: "type".

Addressable consoles also support: 
   "cursorPos", "charWidth", "charHeight", "foreColorAsRGB",  "backColorAsRGB", 
   "widthInChars", "heightInChars", "fontSize", "canvasWidth", "canvasHeight"

You can do a bitwise `&` on type with the following C defines to determine a console capabilities:

- `IO_TYPE_CHARREAD`
- `IO_TYPE_CHARWRITE`
- `IO_TYPE_ADDRESSABLE_DISPLAY`
- `IO_TYPE_CANVAS2D`

For example:
~~~c
if (io_get_prop(stdin, "type")&IO_TYPE_CHARREAD) {
   printf ("okay to read from stdin);
}
~~~



### io_get_width
Returns the width in characters of an addressable console.

~~~c
#include <twr_io.h>

int io_get_width(struct IoConsoleWindow* iow);
~~~

### io_get_height
Returns the height in characters of an addressable console.

~~~c
#include <twr_io.h>

int io_get_height(struct IoConsoleWindow* iow);
~~~

### io_set_colors
For addressable display consoles only.

Sets a 24 bit RGB default color for the foreground and background.  The prior default colors are changed (lost).  For example, if you set the default colors when you created the console (see [twrConsoleTerminal Options](../api/api-typescript.md#class-twrconsoleterminal)), the defaults will no longer be active.  Use `io_get_colors` to save existing colors for later restoration using `io_set_colors`.

A call to `io_set_colors` doesn't actually cause any on screen changes.  Instead, these new default colors are used in future draw and text calls.  A foreground and background color is set for each cell in the console window.  The cell's colors are set to these default foreground/background colors when a call to `io_setc`, `io_setreset`, etc is made.

~~~c
#include <twr_io.h>

void io_set_colors(struct IoConsole* io, unsigned long foreground, unsigned long background);
~~~

### io_setc
For addressable display consoles only.

Sets a console cell to the specified character.  Sends a byte to an console and supports the current locale's character encoding.    This function will "stream" using the current code page.  In other words, if you are in the "C" locale `io_setc` it will set ASCII characters.  If the current locale is set to 1252, then you can send windows-1252 encoded characters.  If the current locale is UTF-8, then you can stream UTF-8 (that is, call `io_setc` once for each byte of the multi-byte UTF-8 character).

~~~c
#include <twr_io.h>

bool io_setc(struct IoConsoleWindow* iow, int location, unsigned char c);
~~~

### io_setc32
For addressable display consoles only.

Sets a console cell to a unicode code point.  The colors are set to the defaults (see `io_set_colors`).

~~~c
#include <twr_io.h>

void io_setc32(struct IoConsoleWindow* iow, int location, int c);
~~~

### io_set_cursor
Moves the cursor.  See `io_get_cursor`.

~~~c
#include <twr_io.h>

void io_set_cursor(struct IoConsoleWindow* iow, int loc);
~~~

### io_set_cursorxy
Set's the cursor's x,y position in an addressable console.

~~~c
#include <twr_io.h>

void io_set_cursorxy(struct IoConsoleWindow* iow, int x, int y);
~~~


### io_setfocus
Sets the input focus to the indicated console.

~~~c
#include <twr_io.h>

void io_setfocus(struct IoConsole* io);
~~~

### io_set_range
Sets a range of characters in an addressable display.

~~~c
#include <twr_io.h>

void io_set_range(struct IoConsoleWindow* iow, int *chars32, int start, int len)
~~~

### io_setreset
For addressable display consoles only.

Sets or resets (clears) a chunky graphics "pixel".  Each character cell can also be a 2x3 grid of graphic "pixels".  In other words, the terminal window has pixel dimensions of width*2 x height*3.

The color will be set to the defaults if the impacted cell is not a graphics cell.  If it is an existing graphics cell, the colors don't change.

See the `stdio-canvas` example.

~~~c
#include <twr_io.h>

bool io_setreset(struct IoConsoleWindow* iow, int x, int y, bool isset);
~~~

### io_mbgetc
`io_mbgetc` will get a character from stdin and encode it using the character encoding of the LC_CTYPE category of the current locale.  "C" will use ASCII.  UTF-8 and windows-1252 are also supported.

~~~c
#include <twr_io.h>

void io_mbgetc(struct IoConsole* io, char* strout);
~~~

### io_mbgets
Gets a string from a Console.  Returns when the user presses "Enter".  Displays a cursor character and echos the inputted characters, at the current cursor position. Uses character encoding of LC_TYPE of current locale.  If the encoding is UTF-8, then the result will be multibyte.

This function is commonly used with  [`stdin`.](../api/api-c-con.md#getting-a-console)

This function requires that you use [`twrWasmModuleAsync`.](../api/api-typescript.md#class-twrwasmmoduleasync)

~~~c
#include <twr_io.h>

char *io_mbgets(struct IoConsole* io, char *buffer );
~~~

### io_point
For addressable display consoles only.

Checks if a chunky graphics "pixel" is set or clear.  See `io_setreset`.

~~~c
#include <twr_io.h>

bool io_point(struct IoConsoleWindow* iow, int x, int y);
~~~

### io_putc
Sends a byte to an IoConsole and supports the current locale's character encoding.    This function will "stream" using the current code page.  In other words, if you `io_putc` ASCII, it will work as "normal".  If the current locale is set to 1252, then you can send windows-1252 encoded characters.  If the current locale is UTF-8, then you can stream UTF-8 (that is, call `io_putc` once for each byte of the multi-byte UTF-8 character).

Note that when characters are sent to the browser console using `stderr` they will not render to the console until a newline, return, or ASCII 03 (End-of-Text) is sent.

~~~c
#include "twr-io.h"

void io_putc(struct IoConsole* io, unsigned char c);
~~~

### io_putstr
Calls `io_putc` for each byte in the passed string.

~~~c
#include "twr-io.h"

void io_putstr(struct IoConsole* io, const char* s);
~~~

### io_printf
Identical to `fprintf`, however io_printf will call `io_begin_draw` and `io_end_draw` around its drawing activities -- resulting in snapper performance.

For example:
~~~c
#include "twr-io.h"

io_printf(twr_debugcon(), "hello over there in browser debug console land\n");
~~~

or

~~~c
#include <stdio.h>
#include <twr_io.h>

io_printf(stdout, "hello world\n");
~~~


~~~c
#include <twr_io.h>

void io_printf(struct IoConsole *io, const char *format, ...);
~~~

### io_begin_draw
For addressable display consoles only.

This call (and its matching io_end_draw) are not required.  But if you bracket any call sequence that draws to the terminal window with an `io_begin_draw` and `io_end_draw`, the updates will be batched into one update.  This will increase performance and usually prevents the user from seeing partial updates.

`io_begin_draw` can be nested. 

See the [stdio-canvas example](../examples/examples-stdio-canvas.md).

~~~c
#include <twr_io.h>

void io_begin_draw(struct IoConsole* io);
~~~

### io_end_draw
For addressable display consoles only.

See `io_begin_draw`.

~~~c
#include <twr_io.h>

void io_end_draw(struct IoConsole* io);
~~~
