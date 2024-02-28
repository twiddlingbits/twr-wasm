

// incomplete, shall we say "tiny", implementation of stdio.h

#ifndef __TINY_STDIO_H__
#define __TINY_STDIO_H__

#include "stddef.h"

#define snprintf(x,y, ...) twr_snprintf(x,y, __VA_ARGS__)
#define printf(...) twr_printf(__VA_ARGS__)
//void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args);

#endif