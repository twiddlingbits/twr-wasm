
# C API - General 
## Overview
`lib-c/twr.a` is the tiny-wasm-runtime static library that provides C APIs your C/C++ code can use.  The debug version is `lib-c/twrd.a.  C APIs fall into these catagories:

- [A subset of stdlib](api-c-stdlib.md), like printf and strcpy
- General functions, like `twr_sleep` and `twr_getchar`
- Draw 2D APIs compatible with JavasScript Canvas
- Console I/O for streamed (tty) or terminal I/O


This sections describes the general "twr_" functions, which are generally found in this include file:

- `\tiny-wasm-runtime\include\twr-crt.h`

## bzero
Set a block of memory to zeros.  Calls `memset(to, 0, count)`.

~~~
#include <string.h>

void bzero (void *to, size_t count);
~~~

## twr_atod
Similar to stdlib `atof`.

~~~
#include "twr-crt.h"

double twr_atod(const char* str);
~~~

## twr_atou64
Convert a string to a 64 bit unsigned integer.

~~~
#include "twr-crt.h"

int64_t twr_atou64(const char *str, int* len);
~~~

## twr_dtoa
~~~
#include "twr-crt.h"

void twr_dtoa(char* buffer, int sizeInBytes, double value, int max_precision);
~~~

The functions to convert double to text are `snprintf`, `fcvt_s`,`twr_dtoa`, `twr_toexponential`, and `twr_tofixed`

## twr_cache_malloc/free
These functions keep allocated memory in a cache for much faster access than the standard malloc/free.
~~~
#include "twr-crt.h"

void *twr_cache_malloc(twr_size_t size);
void twr_cache_free(void* mem);
~~~

## twr_conlog
`twr_conlog` prints debug messages to the browser console from your C code.
~~~
#include "twr-crt.h"

void twr_conlog(char* format, ...);
~~~

Each call to twr_conlog() will generate a single call to console.log() in JavaScript to ensure that you see debug prints.  This call is identical to printf, except that it adds a newline.

The current implementation does not wait for the debug string to output to the console before returning from twr_conlog, when using twrWasmModuleAsync.  In this case, it can take a small bit of time for the string to make its way across the Worker Thread boundary.  This is normally not a problem and results in faster performance.  But if your code crashes soon after the debug print, the print might not appear.  If you think this is an issue, you can call `twr_sleep(1)` after your twr_conlog call.  This will force a blocking wait for the print to print.

Prior to 1.0, this function was called `twr_dbg_printf`, and operated slightly differently.

## twr_epoch_timems
Returns the number of milliseconds since the start of the epoch.
~~~
#include "twr-wasm.h"

uint64_t twr_epoch_timems();
~~~

## twr_getchar
Gets a character from [stdin](../gettingstarted/stdio.md).  Returns a 32 bit unicode code point.
~~~
#include "twr-crt.h"

int twr_getchar();
~~~

Internally this function calls the [stdio](../gettingstarted/stdio.md) IoConsole -- see the IoConsole section for more advanced input/output.

## twr_gets
Gets a string from [stdin](../gettingstarted/stdio.md). The string will be in the current locale's character encoding -- ASCII for "C", and either UTF-8 or windows-1252 for "".  See [localization](../api/api-localization.md).

~~~
#include "twr-crt.h"

char* twr_gets(char* buffer);
~~~

Internally this function uses the [stdio](../gettingstarted/stdio.md) IoConsole -- see the IoConsole section for more advanced input/output.

This function will encode characters as specified by the LC_CTYPE category of the current locale.  ASCII is used for "C", and UTF-8 and Windows-1252 are also supported (see  [localization](../api/api-localization.md))

Note that `twr_gets` is has different localization behavior vs `printf`, `io_putc`, etc.  See [localization](../api/api-localization.md).

## twr_get_current_locale
~~~
extern inline locale_t twr_get_current_locale(void);
~~~

`twr_get_current_locale` will return the locale that has been set by `setlocale`.  It can be used to pass to a function that takes a locale_t.

## twr_mbslen_l
Returns the number of characters in a string using the character encoding of the passed locale (ASCII for "C", UTF-8, or windows-1252 for "").  You can use `twr_get_current_locale` to find the current locale.
~~~
#include <string.h>

size_t twr_mbslen_l(const char *str, locale_t locale);
~~~

## twr_sleep
`twr_sleep` is a traditional blocking sleep function:
~~~
#include "twr-wasm.h"

void twr_sleep(int ms);
~~~

## twr_tofixed
This function is identical to its Javascript version.
~~~
#include "twr-wasm.h"

void twr_tofixed(char* buffer, int buffer_size, double value, int dec_digits);
~~~

The functions to convert double to text are `snprintf`, `fcvt_s`,`twr_dtoa`, `twr_toexponential`, and `twr_tofixed`

## twr_toexponential
This function is identical to its Javascript version.

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
