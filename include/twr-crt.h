#ifndef __TWR_CRT_H__
#define __TWR_CRT_H__

#include <stdint.h>  // uint64_t etc
#include <stdarg.h>  // va_list, etc

#include "twr-io.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef unsigned long twr_size_t;
#define TWR_MAX_SIZE_T 2147483647  // twr_size_t max

int twr_isgraph(int c);
int twr_isspace(int c);
int twr_isdigit(int c);
int twr_isalpha(int c);
int twr_isalnum(int c);
int twr_toupper(int c);
int twr_tolower(int c);

void *twr_malloc(twr_size_t size);
void twr_free(void *mem);
twr_size_t twr_avail(void);
void *twr_realloc( void *ptr, twr_size_t new_size );
void* twr_calloc( twr_size_t num, twr_size_t size );
void *twr_aligned_alloc( twr_size_t alignment, twr_size_t size );
void twr_init_malloc(void* memp, twr_size_t size_in_bytes);
void twr_malloc_debug_stats(void);
void *twr_cache_malloc(twr_size_t size);
void twr_cache_free(void* mem);

twr_size_t twr_strlen(const char * str);
char *twr_strdup(const char * source);
char *twr_strcpy(char *dest, const char *source);
int twr_strcat_s(char *dest, twr_size_t destsz, const char *src);
char *twr_strncpy(char *dest, const char *source, twr_size_t count);
int twr_strcmp(const char* string1, const char* string2);
int twr_strncmp(const char* lhs, const char* rhs, twr_size_t count);
int twr_stricmp(const char* string1, const char* string2);
int twr_strnicmp(const char* string1, const char* string2, twr_size_t count);
char *twr_strstr(const char *haystack, const char *needle);
void twr_strhorizflip(char * buffer, int n);
void *twr_memset(void *mem, int c, twr_size_t n);
void *twr_memcpy(void *dest, const void * src, twr_size_t n);
void *twr_memmove(void *dest, const void *src, twr_size_t n);
int twr_memcmp( const void* lhs, const void* rhs, twr_size_t count );
void twr_bzero (void *to, twr_size_t count);

int twr_rand(void);
void twr_srand(int seed);
#define TWR_RAND_MAX UINT16_MAX

int twr_minint(int a, int b);
int twr_maxint(int a, int b);

int twr_isnan(double v);
int twr_isinf(double v);
double twr_nanval(void);
double twr_infval(void);

#define twr_atof(str) twr_atod(str)
double twr_atod(const char* str);
void twr_dtoa(char* buffer, int sizeInBytes, double value, int max_precision);
int twr_fcvt_s(
   char* buffer,
   twr_size_t sizeInBytes,
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
);

int64_t twr_atou64(const char *str, int* len);
int twr_atosign(const char *str, int* len);
int twr_atoi(const char *str);
long twr_atol( const char *str );
long long twr_atoll( const char *str );
long twr_strtol(const char *str, char **str_end, int base);

int twr_itoa_s(int64_t value, char * buffer, twr_size_t size, int radix);

typedef void (*twr_cbprintf_callback)(void* cbdata, char c);
void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list vlist);
int twr_snprintf(char *buffer, twr_size_t bufsz, const char *format, ... );
int twr_vsnprintf(char *buffer, twr_size_t bufsz, const char *format, va_list vlist);
void twr_printf(const char* format, ...);
void twr_conlog(const char* format, ...);
typedef struct IoConsole FILE; 
void twr_fprintf(FILE *stream, const char* format, ...);
void twr_vfprintf( FILE *stream, const char *format, va_list vlist );


void twr_set_stdio_con(struct IoConsole *setto);
void twr_set_dbgout_con(struct IoConsole *setto);
struct IoConsole * twr_get_stdio_con(void);
struct IoConsole * twr_get_dbgout_con(void);
int twr_getchar(void);
char* twr_gets(char* buffer);

/* fprintf will only work with these -- stderr, stdin, stdout */
#define stderr twr_get_dbgout_con()
#define stdin twr_get_stdio_con()
#define stdout twr_get_stdio_con()

/* internal utility function */
void nstrcopy(char *buffer, const int sizeInBytes, const char *outstring, const int sizeofoutstring, int n);

/** stdlib - div ***/

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

div_t twr_div( int x, int y );
ldiv_t twr_ldiv( long x, long y );
lldiv_t twr_lldiv( long long x, long long y );

/** stdlib - abort **/
_Noreturn void twr_abort(void);

/** time.h */
typedef unsigned long time_t;
unsigned long twr_time(unsigned long *time);

/** sys/time.h */
struct timeval {
	long tv_sec;
	long tv_usec;
};

int twr_gettimeofday(struct timeval *tv);

/* unit tests */
int twr_malloc_unit_test(void);
int twr_string_unit_test(void);
int twr_char_unit_test(void);
int twr_rand_unit_test(void);
int twr_misc_unit_test(void);
int twr_num_int_unit_test(void);
int twr_fcvt_unit_test(void);
int twr_atof_unit_test(void);
int twr_dtoa_unit_test(void);
int twr_printf_unit_test(void);

#ifdef __cplusplus
}
#endif

#endif

