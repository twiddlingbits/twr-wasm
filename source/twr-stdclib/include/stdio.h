

// incomplete, shall we say "tiny", implementation of stdio.h

#ifndef __TINY_STDIO_H__
#define __TINY_STDIO_H__

#include <_stdtypes.h>
#include <assert.h>
#include <stdarg.h>  // va_list, etc
#include "twr-crt.h"  // twr_get_dbgout_con, etc


#ifdef __cplusplus
extern "C" {
#endif

typedef struct IoConsole FILE; 

/* fprintf will only work with these -- stderr, stdin, stdout */
/* these return 'struct IoConsole *' which is same as 'FILE *' */
#define stderr (FILE *)(twr_get_dbgout_con())
#define stdin (FILE *)(twr_get_stdio_con())
#define stdout (FILE *)(twr_get_stdio_con())

int snprintf(char *buffer, size_t bufsz, const char *format, ... );
int vsnprintf(char *buffer, size_t bufsz, const char *format, va_list vlist);
int printf(const char* format, ...);
int vprintf(const char* format, va_list vlist );
int fprintf(FILE *stream, const char* format, ...);
int vfprintf( FILE *stream, const char *format, va_list vlist );
int puts(const char *str);
int putchar(int c);

// remove not implemented; here to get libc++ to compile
static inline int remove( const char* pathname ) {assert(0);return -1;} 

// EOF not implemented; here to get libc++ to compile
#define EOF (-1)  

#ifdef __cplusplus
}
#endif

#endif
