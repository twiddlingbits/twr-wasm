#ifndef __TINY_STDLIB_H__
#define __TINY_STDLIB_H__

#include <_stdtypes.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

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

int __min(int a, int b);
int __max(int a, int b);

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

/************************/

#ifdef __cplusplus
}
#endif

#endif
