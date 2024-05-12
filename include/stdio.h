

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


/* fprintf will only work with these -- stderr, stdin, stdout */
/* these return 'struct IoConsole *' which is same as 'FILE *' */
#define stderr (FILE *)(twr_get_dbgout_con())
#define stdin (FILE *)(twr_get_stdio_con())
#define stdout (FILE *)(twr_get_stdio_con())

int snprintf(char *buffer, size_t bufsz, const char *format, ... );
int sprintf( char *buffer, const char *format, ... );
int vsnprintf(char *buffer, size_t bufsz, const char *format, va_list vlist);
int vasprintf(char **strp, const char* format, va_list vlist );
int printf(const char* format, ...);
int vprintf(const char* format, va_list vlist );
int puts(const char *str);
int putchar(int c);

typedef struct IoConsole FILE; 
#define EOF (-1)  
int vfprintf(FILE *stream, const char *format, va_list vlist);
int fprintf(FILE *stream, const char* format, ...);
size_t fwrite(const void* buffer, size_t size, size_t count, FILE* stream);
int ferror(FILE *stream);
int feof(FILE *stream);
int fflush(FILE *stream);
int is_terminal(FILE *stream);
#define _LIBCPP_TESTING_PRINT_IS_TERMINAL(x) is_terminal(x)
int fputc(int ch, FILE* stream);
int putc(int ch, FILE* stream);
int fgetc(FILE *stream );
int getc(FILE *stream);
int vsscanf(const char *buffer, const char *format, va_list arglist);
int sscanf( const char *buffer, const char *format, ... );
int ungetc(int ch, FILE *stream);


// remove not implemented; here to get libc++ to compile
static inline int remove( const char* pathname ) {assert(0);return -1;} 

#ifdef __cplusplus
}
#endif

#endif
