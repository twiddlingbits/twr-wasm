

// incomplete, shall we say "tiny", implementation of stdio.h

#ifndef __TINY_STDIO_H__
#define __TINY_STDIO_H__

#include "stddef.h"
#include "assert.h"

#ifdef __cplusplus
extern "C" {
#endif

#define snprintf(x,y, ...) twr_snprintf(x,y, __VA_ARGS__)
static inline int vsnprintf(char *buffer, size_t bufsz, const char *format, va_list vlist) {return twr_vsnprintf(buffer, (twr_size_t)bufsz, format, vlist); }
#define printf(...) twr_printf(__VA_ARGS__)
#define fprintf(x, ...) twr_fprintf(x, __VA_ARGS__)
#define vfprintf( x, y, z ) twr_vfprintf( x, y, z ) 


//void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args);

static inline int remove( const char* pathname ) {assert(0);return -1;} // not implemented; here to get libc++ to compile

// EOF not implemented; here to get libc++ to compile
#define EOF (-1)  

#ifdef __cplusplus
}
#endif

#endif
