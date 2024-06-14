
# Streamed and Windowed Console I/O

Also see [stdio](../gettingstarted/stdio.md)

## Examples

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
|"terminal" in/out with a `<canvas>`|[View mini-term demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/stdio-canvas)|


## Overview
C character based input/output is abstracted by `struct IoConsole`.  

Consoles can be "tty" aka "streamed", or they can be "windowed" (aka a "terminal").  

## Getting stderr,stdin, stdout
stdio.h defines `stdin`, `stdout`, `stderr` as explained here: [stdio](../gettingstarted/stdio.md)

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

## Getting a new console
stdin and stdout are set as explaind [here](../gettingstarted/stdio.md).   However, in unusual cases you might want to access the various consoles directly, regardless of how stdin, stdout, or stderr are set.  You can do so like this:

### io_nullcon
Returns an IoConsole that goes to the bit bucket.  io_getc32 will return 0.

~~~
#include "twr-io.h"

struct IoConsole* io_nullcon(void);
~~~

### twr_debugcon
Returns an IoConsole that goes to the browser's debug console.

~~~
#include "twr-crt.h"

struct IoConsole* twr_debugcon(void);
~~~

### twr_divcon
Returns an IoConsole that goes to `<div id="twr_iodiv">`, if it exists.

~~~
#include "twr-crt.h"

struct IoConsole* twr_divcon(void);
~~~

### twr_windowcon
Returns an IoConsole that goes to `<canvas id="twr_iocanvas">` , if it exists. 

NOTE: Only one call can be made to this function, and it is usually made by the runtime, so you likely won't call this function.

~~~
#include "twr-crt.h"

struct IoConsole* twr_windowcon(void);
~~~

## IO Console Functions

### io_putc
Sends a byte to an IoConsole and supports the current locale's character encoding.    This function will "stream" using the current code page.  In other words, if you `io_putc` ASCII, it will work as "normal".  If the current locale is set to 1252, then you can send windows-1252 encoded characters.  If the current locale is UTF-8, then you can stream UTF-8 (that is, call `io_putc` once for each byte of the multi-byte UTF-8 character).

Note that when characters are sent to the browser console using `stderr` they will not render to the console until a newline, return, or ASCII 03 (End-of-Text) is sent.

~~~
#include "twr-io.h"

void io_putc(struct IoConsole* io, unsigned char c);
~~~

### io_putstr
Calls `io_putc` for each byte in the passed string.

~~~
#include "twr-io.h"

void io_putstr(struct IoConsole* io, const char* s);
~~~

### io_printf
Identical to `fprintf`, however io_printf will call `io_begin_draw` and `io_end_draw` around its drawing activities -- resulting in snapper performance.

For example:
~~~
#include "twr-io.h"

io_printf(twr_debugcon(), "hello over there in browser debug console land\n");
~~~

or

~~~
#include <stdio.h>
#include <twr_io.h>

io_printf(stdout, "hello world\n");
~~~


~~~
#include <twr_io.h>

void io_printf(struct IoConsole *io, const char *format, ...);
~~~

### io_getc32
Waits for the user to enter and then returns a unicode code point. Currently only really works with an IoConsole that is stdin.

To return characters encoded with the current locale, see `io_mbgetc`

~~~
#include <twr_io.h>

int io_getc32(struct IoConsole* io);
~~~

### io_mbgetc
`io_mbgetc` will get a character from stdin and encode it using the character encoding of the LC_CTYPE category of the current locale.  "C" will use ASCII.  UTF-8 and windows-1252 are also supported.

~~~
#include <twr_io.h>

void io_mbgetc(struct IoConsole* io, char* strout);
~~~

### io_mbgets
Gets a string from an IoConsole (which needs to be stdin).  Returns when the user presses "Enter".  Displays a cursor character and echos the inputted characters, at the current cursor position. Uses character encoding of LC_TYPE of current locale.

~~~
#include <twr_io.h>

char *io_mbgets(struct IoConsole* io, char *buffer );
~~~

### io_get_cursor
Returns an integer of the current cursor position.  The cursor is where the next io_putc is going to go. 

For windowed consoles, the cursor position ranges from [0, width*height-1], inclusive.

~~~
#include <twr_io.h>

int io_get_cursor(struct IoConsole* io);
~~~

### io_set_colors
For windowed consoles only.

Sets a 24 bit RGB default color for the foreground and background.  The prior default colors are changed (lost).  For example, if you set the default colors when you created the window (see [stdio](../gettingstarted/stdio.md)), the defaults will no longer be active.  Use `io_get_colors` to save existing colors for later restoration using `io_set_colors`.

A call to `io_set_colors` doesn't actually cause any on screen changes.  Instead, these new default colors are used in future draw and text calls.  A foreground and background color is set for each cell in the console window.  The cell's colors are set to these default foreground/background colors when a call to `io_setc`, `io_setreset`, etc is made.

~~~
#include <twr_io.h>

void io_set_colors(struct IoConsole* io, unsigned long foreground, unsigned long background);
~~~

### io_get_colors
For windowed consoles only.

Gets the current default colors.

~~~
#include <twr_io.h>

void io_get_colors(struct IoConsole* io, unsigned long *foreground, unsigned long *background);
~~~

### io_cls
For windowed consoles only.

Clears the screen.  That is, all character cells in the window are set to a space, their colors are reset to the current default colors (see `io_set_colors`).

~~~
#include <twr_io.h>

void io_cls(struct IoConsoleWindow* iow);
~~~

### io_setc
For windowed consoles only.

Sets a window cell to a character.  Sends a byte to an IoConsole and supports the current locale's character encoding.    This function will "stream" using the current code page.  In other words, if you `io_setc` ASCII, it will work as "normal".  If the current locale is set to 1252, then you can send windows-1252 encoded characters.  If the current locale is UTF-8, then you can stream UTF-8 (that is, call `io_setc` once for each byte of the multi-byte UTF-8 character).

~~~
#include <twr_io.h>

bool io_setc(struct IoConsoleWindow* iow, int location, unsigned char c);
~~~

### io_setc32
For windowed consoles only.

Sets a window cell to a unicode code point.  The colors are set to the defaults (see `io_set_colors`).

~~~
#include <twr_io.h>

void io_setc32(struct IoConsoleWindow* iow, int location, int c);
~~~

### io_setreset
For windowed consoles only.

Sets or resets (clears) a chunky graphics "pixel".  Each character cell can also be a 2x3 grid of graphic "pixels".  In other words, the terminal window has pixel dimensions of width*2 x height*3.

The color will be set to the defaults if the impacted cell is not a graphics cell.  If it is an existing graphics cell, the colors don't change.

See the `stdio-canvas` example.

~~~
#include <twr_io.h>

bool io_setreset(struct IoConsoleWindow* iow, int x, int y, bool isset);
~~~

### io_point
For windowed consoles only.

Checks if a chunky graphics "pixel" is set or clear.  See `io_setreset`.

~~~
#include <twr_io.h>

bool io_point(struct IoConsoleWindow* iow, int x, int y);
~~~

### io_set_cursor
Moves the cursor.  See `io_get_cursor`.

~~~
#include <twr_io.h>

void io_set_cursor(struct IoConsoleWindow* iow, int loc);
~~~

### io_begin_draw
For windowed consoles only.

This call (and its matching io_end_draw) are not required.  But if you bracket any call sequence that draws to the terminal window with an `io_begin_draw` and `io_end_draw`, the updates will be batched into one update.  `io_begin_draw` can be nested.  This will increase performance and usually prevents the user from seeing partial updates.

See the terminal-window io_canvas example.

~~~
#include <twr_io.h>

void io_begin_draw(struct IoConsole* io);
~~~

### io_end_draw
For windowed consoles only.

See `io_begin_draw`.

~~~
#include <twr_io.h>

void io_end_draw(struct IoConsole* io);
~~~
