

// incomplete, shall we say "tiny", implementation of stdio.h

#ifndef __TINY_STDIO_H__
#define __TINY_STDIO_H__

#include "stddef.h"
#include "assert.h"

#ifdef __cplusplus
extern "C" {
#endif


int snprintf(char *buffer, twr_size_t bufsz, const char *format, ... );
static inline int vsnprintf(char *buffer, size_t bufsz, const char *format, va_list vlist) {return twr_vsnprintf(buffer, (twr_size_t)bufsz, format, vlist); }

int printf(const char* format, ...);
static inline int vprintf(const char *format, va_list vlist) {return twr_vprintf(format, vlist);}

int fprintf(FILE *stream, const char* format, ...);
static inline int vfprintf( FILE *stream, const char *format, va_list vlist ) {return twr_vfprintf(stream, format, vlist);}

// remove not implemented; here to get libc++ to compile
static inline int remove( const char* pathname ) {assert(0);return -1;} 

// EOF not implemented; here to get libc++ to compile
#define EOF (-1)  

#ifdef __cplusplus
}
#endif

#endif
