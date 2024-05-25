
# C API - General 
## Overview
`lib-c/twr.a` is the tiny-wasm-runtime static library that provides C APIs your C/C++ code can use.  The debug version is `lib-c/twrd.a.  C APIs fall into these catagories:

- [A subset of stdlib](api-c-stdlib.md), like printf and strcpy
- General functions, like `twr_sleep` and `twr_getchar`
- Draw 2D APIs compatible with JavasScript Canvas
- Console I/O for streamed (tty) or terminal I/O


This sections describes the general "twr_" functions, which are generally found in this include file:

- `\tiny-wasm-runtime\include\twr-crt.h`

## twr_getchar
Gets a character from [stdin](../gettingstarted/stdio.md)
~~~
#include "twr-crt.h"

int twr_getchar();
~~~

Internally this function calls the [stdio](../gettingstarted/stdio.md) IoConsole -- see the IoConsole section for more advanced input/output.

## twr_gets
Gets a string from [stdin](../gettingstarted/stdio.md) 
~~~
#include "twr-crt.h"

char* twr_gets(char* buffer);
~~~

Internally this function calls the [stdio](../gettingstarted/stdio.md) IoConsole -- see the IoConsole section for more advanced input/output.
## twr_conlog
`twr_conlog` prints debug messages to the browser console from your C code.
~~~
#include "twr-crt.h"

void twr_conlog(char* format, ...);
~~~

Each call to twr_conlog() will generate a single call to console.log() in JavaScript to ensure that you see debug prints.  This call is identical to printf, except that it adds a newline.

The current implementation does not wait for the debug string to output to the console before returning from twr_conlog, when using twrWasmModuleAsync.  In this case, it can take a small bit of time for the string to make its way across the Worker Thread boundary.  This is normally not a problem and results in faster performance.  But if your code crashes soon after the debug print, the print might not appear.  If you think this is an issue, you can call `twr_sleep(1)` after your twr_conlog call.  This will force a blocking wait for the print to print.

Prior to 1.0, this function was called `twr_dbg_printf`, and operated slightly differently.

## twr_sleep
`twr_sleep` is a traditional blocking sleep function:
~~~
#include "twr-wasm.h"

void twr_sleep(int ms);
~~~

## twr_epoch_timems
Returns the number of milliseconds since the start of the epoch.
~~~
#include "twr-wasm.h"

uint64_t twr_epoch_timems();
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

## twr_dtoa
~~~
#include "twr-crt.h"

void twr_dtoa(char* buffer, int sizeInBytes, double value, int max_precision);
~~~

The functions to convert double to text are `snprintf`, `fcvt_s`,`twr_dtoa`, `twr_toexponential`, and `twr_tofixed`

## twr_atod
Similar to stdlib `atof`.
~~~
#include "twr-crt.h"

double twr_atod(const char* str);
~~~

## twr_atou64
~~~
#include "twr-crt.h"

int64_t twr_atou64(const char *str, int* len);
~~~

## floating math helpers
~~~

int twr_isnan(double v);
int twr_isinf(double v);
double twr_nanval();
double twr_infval();
~~~

## twr_cache_malloc/free
These functions keep allocated memory in a cache for much faster access than the standard malloc/free.
~~~
#include "twr-crt.h"

void *twr_cache_malloc(twr_size_t size);
void twr_cache_free(void* mem);
~~~

## twr_strhorizflip
Mirror image the passed in string.
~~~
#include "twr-crt.h"

void twr_strhorizflip(char * buffer, int n);
~~~

## twr_vprintf
performs a printf by calling the callback with cbdata for each character.
~~~
#include "twr-crt.h"

void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args);
~~~

