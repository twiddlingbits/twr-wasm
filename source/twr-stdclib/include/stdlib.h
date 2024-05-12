#ifndef __TINY_STDLIB_H__
#define __TINY_STDLIB_H__

#include <_stdtypes.h>
#include <stdint.h>
#include <locale.h>

#ifdef __cplusplus
extern "C" {
#endif

/************************/

// change this if / when i implement support for utf-8
#define MB_CUR_MAX 1

/************************/


void *malloc(size_t size);
void free(void *mem);
size_t avail(void);
void *realloc( void *ptr, size_t new_size );
void* calloc( size_t num, size_t size );
void *aligned_alloc( size_t alignment, size_t size );

/************************/

int rand(void);
void srand(int seed);
#define RAND_MAX 65535  // UINT16_MAX

/************************/

#define __min(a,b) (((a) < (b)) ? (a) : (b))
#define __max(a,b) (((a) > (b)) ? (a) : (b))

/************************/

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
long long strtoll_l(const char *str, char **str_end, int base,  locale_t __attribute__((__unused__)) loc);
unsigned long long strtoull(const char *str, char **str_end,  int base);
unsigned long long strtoull_l(const char *str, char **str_end,  int base, locale_t __attribute__((__unused__)) loc);
unsigned long strtoul(const char *str, char ** str_end,  int base);
float strtof(const char *str, char ** str_end);
float strtof_l(const char *str, char ** str_end, locale_t locale);
double strtod(const char *str, char **str_end);
double strtod_l(const char *str, char **str_end, locale_t __attribute__((__unused__)) locale);
long double strtold(const char *str, char **str_end);
long double strtold_l(const char *str, char **str_end, locale_t locale);
int _itoa_s(int64_t value, char * buffer, size_t size, int radix);

/************************/

typedef struct {
	int quot;	
	int rem;		
} div_t;

typedef struct {
	long quot;	
	long rem;		
} ldiv_t;

typedef struct {
	long long quot;	
	long long rem;		
} lldiv_t;

div_t div( int x, int y );
ldiv_t ldiv( long x, long y );
lldiv_t lldiv( long long x, long long y );

/************************/

_Noreturn void abort(void);
int atexit(void (*func)(void));
int __cxa_atexit (void (*callback)(void *), void *payload, void* dso_handle);

/************************/

#ifdef __cplusplus
}
#endif

#endif
