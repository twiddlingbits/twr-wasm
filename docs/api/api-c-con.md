
# Console I/O (Windowed, Streamed, Null)
## Examples

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
|"terminal" in/out with a `<canvas>`|[View mini-term demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-canvas)|


## Overview
C character based input/output is abstracted by:

~~~
struct IoConsole
~~~

Consoles can be "tty" aka "streamed", or they can be "windowed" (aka a "terminal").

Windowed consoles allow text to be placed in assigned positions in the `twr_iocanvas`.  Unicode characters and symbols are supported. The windows console also supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array),   

There are four consoles that generally exist in the tiny-wasm-runtime world:
 1. null - goes to the preverbal bit bucket
 2. debug - output only.  Goes to the Web Browser debug console.
 3. div - streamed input/output to a `<div>` tag
 4. canvas - streamed or windowed input/output to a `<canvas>` tag.  You can specify the width and height by the number of characters.  For example, 80X40.  The font is fixed width courier, but you can change the size (see twrWasmModule constructor options)

`stdio` is set to one of these consoles -- see [stdio](../gettingstarted/stdio.md)

stdlib functions like `printf` will send their output to the assigned stdio console. But you can also send output to a console that is not assigned as stdio.  For example:

~~~
   #include "twr-wasm.h"

   io_printf(twr_debugcon(), "hello over there in browser debug console land\n");
~~~

or

~~~
   #include <stdio.h>

   fprintf(stderr, "hello over there in browser debug console land\n");
~~~

## Functions

### io_getc_l
~~~
#include <twr_io.h>

void io_getc_l(struct IoConsole* io, char* strout, locale_t loc);
~~~

`io_getc_l` will get a character from stdin and encode it using the character encoding of the LC_CTYPE category of the passed locale.  "C" will use ASCII.  UTF-8 and windows-1252 are also supported.

~~~
struct IoConsole * twr_get_stdio_con();
void twr_set_stdio_con(struct IoConsole *setto);
void twr_set_dbgout_con(struct IoConsole *setto);

struct IoConsole* twr_get_nullcon();
struct IoConsole* twr_debugcon();
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_windowcon();

void io_putc(struct IoConsole* io, char c);
void io_putstr(struct IoConsole* io, const char* s);
char io_inkey(struct IoConsole* io);
void io_close(struct IoConsole* io);
void io_printf(struct IoConsole *io, const char *format, ...);
int io_getc(struct IoConsole* io);
char *io_gets(struct IoConsole* io, char *buffer );
int io_get_cursor(struct IoConsole* io);

void io_cls(struct IoConsoleWindow* iow);
void io_set_c(struct IoConsoleWindow* iow, int loc, unsigned char c);
bool io_setreset(struct IoConsoleWindow* iow, short x, short y, bool isset);
short io_point(struct IoConsoleWindow* iow, short x, short y);
void io_set_cursor(struct IoConsoleWindow* iow, int loc);
void io_draw_range(struct IoConsoleWindow* iow, int x, int y);
~~~
