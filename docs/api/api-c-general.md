---
title: General C API for Wasm
description: twr-wasm provides a set of general purpose APIs for use in C/C++ WebAssembly. For example, sleep, get input, conversion, unicode, etc.
---

# General C API for Wasm
## Overview
This sections describes the "general" twr-wasm functions available that don't fit neatly into another category (such as standard C library functions, Draw 2D functions, etc.) 

These functions often start with "twr_" and are generally found in this include file:

`\twr-wasm\include\twr-crt.h`

## bzero
Set a block of memory to zeros.  Calls `memset(to, 0, count)`.

~~~
#include <string.h>

void bzero (void *to, size_t count);
~~~

## getc
This is the standard c library function (see the the standard library docs available on the internet). 

Of note this function will return extended ASCII (128-255 inclusive).  The extend ASCII are always encoded with Windows-1252 encoding.  

See `twr_getc32` for  a list of related functions.

Note that C character input is blocking and you must use twrWasmModuleAsync -- see [stdin](../gettingstarted/stdio.md) for details on how to enable blocking character input.

## twr_atod
Similar to stdlib `atof`.

~~~
#include "twr-crt.h"

double twr_atod(const char* str);
~~~

## twr_atou64
Convert a string to a 64 bit unsigned integer, stopping when the first non-valid character is encountered.  If len is provided, it will be set to the number of characters read.  Radix should be >=2 and <=36 -- for example, 10 is a normal base 10 number and 16 is hexadecimal.

~~~
#include "twr-crt.h"

int64_t twr_atou64(const char *str, int* len, int radix);
~~~

## twr_dtoa
The functions to convert double to text are `snprintf`, `fcvt_s`,`twr_dtoa`, `twr_toexponential`, and `twr_tofixed`

~~~
#include "twr-crt.h"

void twr_dtoa(char* buffer, int sizeInBytes, double value, int max_precision);
~~~

## twr_cache_malloc/free
These functions keep allocated memory in a cache for much faster re-access than the standard malloc/free.

~~~
#include "twr-crt.h"

void *twr_cache_malloc(twr_size_t size);
void twr_cache_free(void* mem);
~~~

## twr_code_page_to_utf32_streamed
Return a unicode code point (aka utf-32 value) when passed a byte stream that represents an encoded character using the current local's LC_CTYPE code page. A zero is returned if the byte stream has not yet completed a decode.  

For example:

~~~
int cp

setlocale(LC_ALL, "");  // set to default locale, which will be UTF-8 encoding with local language/region

// turn a UTF-8 Euro into a UTF-32 value
cp==twr_code_page_to_utf32_streamed(0xE2);
assert (cp==0);
cp=twr_code_page_to_utf32_streamed(0x82);
assert (cp==0);
cp=twr_code_page_to_utf32_streamed(0xAC);
assert (cp==0x000020AC);   // Euro Code points
~~~

~~~
#include <locale.h>

int twr_code_page_to_utf32_streamed(unsigned char byte) 
~~~

## twr_conlog
`twr_conlog` prints debug messages to `stderr` (usually your browser console) from your C code.
~~~
#include "twr-crt.h"

void twr_conlog(char* format, ...);
~~~
This call is identical to `fprintf(stderr, ...)`, except that it adds a newline.

When `stderr` is set to `twrConsoleDebug` each call to twr_conlog() will generate a single call to console.log() in JavaScript to ensure that you see debug prints.  

The current implementation does not wait for the debug string to output to the console before returning from twr_conlog, when using twrWasmModuleAsync.  In this case, it can take a small bit of time for the string to make its way across the Worker Thread boundary.  This is normally not a problem and results in faster performance.  But if your code crashes soon after the debug print, the print might not appear.  If you think this is an issue, you can call `twr_sleep(1)` after your twr_conlog call.  This will force a blocking wait for the print to print.

## twr_epoch_timems
Returns the number of milliseconds since the start of the epoch.
~~~
#include "twr-wasm.h"

uint64_t twr_epoch_timems();
~~~

## twr_getc32
Gets a 32 bit unicode code point character from [stdin](../gettingstarted/stdio.md). Unlike the standard C library function `getchar`, `twr_getc32` does not buffer a line (that is, `twr_getc32` will return a character before the user presses Enter).

`twr_getc32` is implemented as:
~~~
int twr_getc32() {
	return io_getc32(twr_get_stdio_con());
}
~~~

Note that stdlib `getchar` and `ungetc` are not currently implemented. 

Note that C character input with these functions is blocking and you must use twrWasmModuleAsync -- see [stdin](../gettingstarted/stdio.md) for details on how to enable blocking character input.

Also see:

- `io_mbgets` - get a multibyte string from a console using the current locale character encoding.   Console must support IO_TYPE_CHARREAD.
- `twr_mbgets` - the same as `io_mbgets` with the console set to `stdin`.
- `io_mbgetc` - get a multibyte character from an IoConsole (like `stdin`) using the current locale character encoding
- `getc` (sames as `fgetc`) - get a single byte from a FILE * (IoConsole) -- returning ASCII or extended ASCII (window-1252 encoding)
- `io_getc32` - gets a 32 bit unicode code point from an IoConsole (which must support IO_TYPE_CHARREAD)

~~~
#include "twr-crt.h"

int twr_getc32();
~~~


## twr_get_navlang

Returns the BCP 47 language tag as found in javacript `navigator.language`.  If len is not null, it will be filled in with the string length of the language tag.

~~~
#include "twr-crt.h"

const char* twr_get_navlang(int *len);
~~~

## twr_get_current_locale
~~~
extern inline locale_t twr_get_current_locale(void);
~~~

`twr_get_current_locale` will return the locale that has been set by `setlocale`.  It can be used to pass to a function that takes a locale_t.

## twr_localize_numeric_string

Functions like `twr_dtoa` do not localize the decimal point.  To get a localized decimal point, you can use `printf`,  or alternately `twr_localize_numeric_string` to post process a string.   For example:

~~~
char b[10];
strcpy(b, "1.23");
twr_localize_numeric_string(b, twr_get_current_locale());
// if locale was set to french, then b is now 1,23
~~~

~~~
#include <locale.h>

void twr_localize_numeric_string(char* str, locale_t locale);
~~~

## twr_mem_debug_stats
Print memory map and malloc stats to stderr or stdout.

(note FILE * is the same as twr_ioconsole_t*)

~~~
#include <stdio.h>

void twr_mem_debug_stats(twr_ioconsole_t* outcon);
~~~

## twr_mbgets
Gets a string from [stdin](../gettingstarted/stdio.md). The string will be in the current locale's character encoding -- ASCII for "C", and either UTF-8 or windows-1252 for "".  See [Character Encoding Support with twr-wasm](../gettingstarted/charencoding.md).

~~~
#include "twr-crt.h"

char* twr_mbgets(char* buffer);
~~~

Internally this function uses the [stdio](../gettingstarted/stdio.md) IoConsole -- see the IoConsole section for more advanced input/output.

This function will encode characters as specified by the LC_CTYPE category of the current locale.  ASCII is used for "C", and UTF-8 and Windows-1252 are also supported (see  [localization](../api/api-c-localization.md))

Note that C character input is blocking and you must use twrWasmModuleAsync -- see [stdin](../gettingstarted/stdio.md) for details on how to enable blocking character input.

## twr_mbslen_l
Returns the number of characters in a string using the character encoding of the passed locale (ASCII for "C", UTF-8, or windows-1252 for "").  You can use `twr_get_current_locale` to find the current locale.
~~~
#include <string.h>

size_t twr_mbslen_l(const char *str, locale_t locale);
~~~

## twr_sleep
`twr_sleep` is a traditional blocking sleep function.   This function is blocking, and so is only available if you use `twrWasmModuleAsync`.

~~~
#include "twr-wasm.h"

void twr_sleep(int ms);
~~~

## twr_register_callback
Returns a new event ID that is paired with the specified C function.  This event ID can be passed to functions that accept an event ID.  When the event is triggered, the specified callback is called. 

The callback function's first argument will be the event ID.  Subsequent arguments are event specific.  It is legal to register the same callback for multiple event IDs.

~~~c
int twr_register_callback(const char* func_name);
~~~

For example:
~~~c
// timer event callback (called once)
__attribute__((export_name("on_timer1")))
void on_timer1(int event_id) {
   printf("timer callback 1 entered (event id=%d) !\n", event_id);
}

// entry point
__attribute__((export_name("twr_main")))
void twr_main() {
   int timer1=twr_register_callback("on_timer1");
   twr_timer_single_shot(2000, timer1);
}
~~~

## twr_timer_single_shot
Triggers the specified event (callback) once after `milliSeconds`.  Returns a `timerID` which can be used with `twr_timer_cancel`.

~~~
int twr_timer_single_shot(int milliSeconds, int eventID);
~~~

## twr_timer_repeat
Triggers the specified event (callback) repeatedly after `milliSeconds`.  Returns a `timerID` which can be used with `twr_timer_cancel`.

~~~
int twr_timer_repeat(int milliSeconds, int eventID);
~~~

## twr_timer_cancel
Cancels the specfied timer.

~~~
void twr_timer_cancel(int timerID);
~~~

## twr_tofixed
This function is identical to its JavaScript version.
~~~
#include "twr-wasm.h"

void twr_tofixed(char* buffer, int buffer_size, double value, int dec_digits);
~~~

The functions to convert double to text are `snprintf`, `fcvt_s`,`twr_dtoa`, `twr_toexponential`, and `twr_tofixed`

## twr_toexponential
This function is identical to its JavaScript version.

~~~
#include "twr-wasm.h"

void twr_toexponential(char* buffer, int buffer_size, double value, int dec_digits);
~~~

The functions to convert double to text are `snprintf`, `fcvt_s`,`twr_dtoa`, `twr_toexponential`, and `twr_tofixed`

## twr_strhorizflip
Mirror image the passed in string.
~~~
#include "twr-crt.h"

void twr_strhorizflip(char * buffer, int n);
~~~

## twr_utf8_char_len
Returns the number of bytes in a UTF-8 character (passed as a string pointer).  UTF-8 characters can be 1 to 4 bytes in length.
~~~
#include <string.h>

int twr_utf8_char_len(const char *str);
~~~

## twr_utf32_to_code_page

Takes a utf32 value (aka unicode code point value), and fills in the passed character array buffer with the character encoding of the utf32 value, using the current locale's LC_CTYPE code page. The buffer is 0 terminated.

Also see `c32rtomb` and `c16rtomb`.

For example:
~~~
char strbuf[6];  			// max size of utf-8 is 4+terminating zero.  Max size of ASCII or windows 1252 is 1 + terminating zero
setlocale(LC_ALL, "");  // set to default locale, which will be UTF-8 encoding with local language/region
twr_utf32_to_code_page(strbuf, 0x000020AC);  // encode a Euro code point 
printf("%s", strbuf); 
assert ( strcmp(strbuf,"\xE2\x82\xAC")==0 );  // utf-8 encoding of euro
assert ( strcmp(strbuf,"€")==0 );  			// clang string literals default to utf-8 encoding
~~~

~~~
include <locale.h>

void twr_utf32_to_code_page(char* out, int utf32)
~~~

## twr_vprintf
Performs a printf by calling the callback with cbdata for each character.
~~~
#include "twr-crt.h"

void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args);
~~~

## floating math helpers
~~~

int twr_isnan(double v);
int twr_isinf(double v);
double twr_nanval();
double twr_infval();
~~~
