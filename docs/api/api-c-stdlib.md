---
title: Standard C library for WebAssembly
description: twr-wasm implements the Standard C Library optimized for Web Assembly.
---

# Standard C library for WebAssembly
This section describes twr-wasm's support for the Standard C Library.   twr-wasm includes its own implementation of the standard C library optimized for WebAssembly and Wasm running in a web browser.  This is a core feature of twr-wasm.

 For documentation of these functions, see the many standard C library documentation web sites.

 The following subset of the standard C library is available. Also see `twr-wasm/include` folder for include files.

## stdio.h
~~~
* fprintf will only work with these -- stderr, stdin, stdout */
/* these return 'struct IoConsole *' which is same as 'FILE *' */
#define stderr (FILE *)(twr_get_stderr_con())
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
int vfprintf(FILE *stream, const char *format, va_list vlist);
int fprintf(FILE *stream, const char* format, ...);
size_t fwrite(const void* buffer, size_t size, size_t count, FILE* stream);
int ferror(FILE *stream);
int feof(FILE *stream);
int fflush(FILE *stream);
int is_terminal(FILE *stream);
int fputc(int ch, FILE* stream);
int putc(int ch, FILE* stream);
int fgetc(FILE *stream );
int getc(FILE *stream);
~~~

## stdlib.h
~~~
void *malloc(size_t size);
void free(void *mem);
size_t avail(void);
void *realloc( void *ptr, size_t new_size );
void* calloc( size_t num, size_t size );
void *aligned_alloc( size_t alignment, size_t size );

int rand(void);
void srand(int seed);

#define __min(a,b) (((a) < (b)) ? (a) : (b))
#define __max(a,b) (((a) > (b)) ? (a) : (b))

int _fcvt_s(
   char* buffer,
   size_t sizeInBytes,
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
);
double atof(const char* str);
int atoi(const char *str);
long atol( const char *str );
long long atoll( const char *str );
long strtol(const char *str, char **str_end, int base);
long long strtoll(const char *str, char **str_end, int base);
long long strtoll_l(const char *str, char **str_end, int base,  locale_t loc);
unsigned long long strtoull(const char *str, char **str_end,  int base);
unsigned long long strtoull_l(const char *str, char **str_end,  int base, locale_t loc);
unsigned long strtoul(const char *str, char ** str_end,  int base);
float strtof(const char *str, char ** str_end);
float strtof_l(const char *str, char ** str_end, locale_t locale);
double strtod(const char *str, char **str_end);
double strtod_l(const char *str, char **str_end, locale_t locale);
long double strtold(const char *str, char **str_end);
long double strtold_l(const char *str, char **str_end, locale_t locale);
int _itoa_s(int64_t value, char * buffer, size_t size, int radix);

div_t div( int x, int y );
ldiv_t ldiv( long x, long y );
lldiv_t lldiv( long long x, long long y );

_Noreturn void abort(void);
int atexit(void (*func)(void));
~~~

Note that _fcvt_s as currently enabled has these limitations:
   - fractional digits <=100
   - values must be less than 1e+21
   - values negative exponents must be smaller than 1e-99

There is a full featured version of _fcvt_s in the source code, but is not currently enabled, since the version enabled is smaller and works in most use cases.
## assert.h
~~~
void assert(int expression);
~~~

## math.h
~~~
int abs(int n);
double acos(double arg);
double asin(double arg);
double atan(double arg);
double ceil(double arg);
double cos(double arg);
double exp(double arg);
double fabs(double arg);
double floor(double arg);
double fmod(double x, double y);
double log(double arg);
double pow(double base, double exp);
double sin(double arg);
double sqrt(double arg);
double tan(double arg);
double trunc(double arg);
~~~

## stdarg.h
~~~
#define va_start(v,l)	__builtin_va_start(v,l)
#define va_end(v)	__builtin_va_end(v)
#define va_arg(v,l)	__builtin_va_arg(v,l)
#define va_copy(d,s)	__builtin_va_copy(d,s)
typedef __builtin_va_list va_list;
~~~

## ctype.h
~~~
int isascii(int);
int toascii(int);
int isalnum(int c);
int isalpha(int c);
int isblank(int);
int iscntrl(int);
int isdigit(int c);
int isgraph(int c);
int islower(int);
int isprint(int);
int ispunct(int);
int isspace(int c);
int isupper(int);
int isxdigit(int);
int tolower(int c);
int toupper(int c);

int isalnum_l(int c, locale_t loc);
int isalpha_l(int c, locale_t loc);
int isblank_l(int c, locale_t loc);
int iscntrl_l(int c, locale_t loc);
int isdigit_l(int c, locale_t loc);
int isgraph_l(int c, locale_t loc);
int islower_l(int c, locale_t loc);
int isprint_l(int c, locale_t loc);
int ispunct_l(int c, locale_t loc);
int isspace_l(int c, locale_t loc);
int isupper_l(int c, locale_t loc);
int isxdigit_l(int c, locale_t loc);
int tolower_l(int c, locale_t loc);
int toupper_l(int c, locale_t loc);
~~~

## stddef.h
~~~
#define offsetof(TYPE, MEMBER) __builtin_offsetof (TYPE, MEMBER)
typedef __PTRDIFF_TYPE__ ptrdiff_t;
typedef double max_align_t;
~~~

## string.h
~~~
size_t strlen(const char * str);
char *strdup(const char * source);
char *strcpy(char *dest, const char *source);
int strcat_s(char *dest, size_t destsz, const char *src);
char* strcat(char *dest, const char *src);
char *strncpy(char *dest, const char *source, size_t count);
int strcmp(const char* string1, const char* string2);
int strncmp(const char* lhs, const char* rhs, size_t count);
int stricmp(const char* string1, const char* string2);
int strnicmp(const char* string1, const char* string2, size_t count);
int strcoll(const char* lhs, const char* rhs);
int strcoll_l(const char* lhs, const char* rhs,  locale_t loc);
char *strchr(const char *str, int ch);
void *memchr(const void *ptr, int ch, size_t count);
char *strstr(const char *haystack, const char *needle);
char * strerror(int errnum );
char * _strerror(const char *strErrMsg);
void *memmove(void *dest, const void *src, size_t n);
int memcmp( const void* lhs, const void* rhs, size_t count );
void bzero (void *to, size_t count);

// implemented in memcpy.wat
void *memcpy(void *dest, const void * src, size_t n);
void *memset(void *mem, int c, size_t n);
~~~

## time.h
~~~
typedef unsigned long time_t;
unsigned long time(unsigned long *time);
size_t strftime(char *s, size_t maxsize, const char *format, const struct tm *timeptr);
size_t strftime_l(char *s, size_t maxsize, const char *format, const struct tm *timeptr, locale_t  locale);
struct tm *localtime(const time_t *timer);
int gettimeofday(struct timeval *tv, void* notused);
#define timerisset(tvp)		((tvp)->tv_sec || (tvp)->tv_usec)
#define timercmp(tvp,uvp,cmp)					\
		((tvp)->tv_sec cmp (uvp)->tv_sec ||		\
		 ((tvp)->tv_sec == (uvp)->tv_sec && (tvp)->tv_usec cmp (uvp)->tv_usec))
#define timerclear(tvp)		(tvp)->tv_sec = (tvp)->tv_usec = 0
~~~

## locale.h
~~~
#define LC_GLOBAL_LOCALE twr_get_current_locale()
char* setlocale(int category, const char* locale);
struct lconv *localeconv(void);
locale_t newlocale(int category_mask, const char *locale, locale_t base);
locale_t	uselocale(locale_t);
void freelocale(locale_t);
locale_t duplocale(locale_t);
extern inline locale_t twr_get_current_locale(void);
~~~

## uchar.h
~~~
typedef uint_least32_t char32_t;
typedef uint_least16_t char16_t;

size_t c32rtomb( char* s, char32_t c32, mbstate_t* ps );
~~~

## errno.h
~~~
typedef int errno_t;

extern int * _errno(void);
#define errno (*_errno())

errno_t  _set_errno(int _Value);
errno_t  _get_errno(int *_Value);
~~~

## _stdtypes.h
// don't include directly -- included by various .h files
~~~
typedef unsigned long size_t;
#define MAX_SIZE_T 2147483647  

#ifdef __cplusplus
#define NULL __null
#else
#define NULL ((void*)0)
#endif

typedef struct __locale_t_struct * locale_t;
~~~

## Other include files available
~~~
float.h
limits.h
stdbool.h
stdint.h
~~~

