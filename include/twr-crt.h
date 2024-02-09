#ifndef __TWR_CRT_H__
#define __TWR_CRT_H__

#include <stdint.h>  // uint64_t etc
#include <stdarg.h>  // va_list, etc

#include "twr-io.h"
#include "../twr-bigint/twr-bigint.h"

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
int twr_avail();


twr_size_t twr_strlen(const char * str);
char *twr_strdup(const char * source);
char *twr_strcpy(char *dest, const char *source);
int twr_strcat_s(char *restrict dest, twr_size_t destsz, const char *restrict src);
char *twr_strncpy(char *dest, const char *source, twr_size_t count);
int twr_strcmp(const char* string1, const char* string2);
int twr_strncmp(const char* lhs, const char* rhs, twr_size_t count);
int twr_stricmp(const char* string1, const char* string2);
int twr_strnicmp(const char* string1, const char* string2, twr_size_t count);
char *twr_strstr(const char *haystack, const char *needle);
void twr_strhorizflip(char * buffer, int n);
void *twr_memset(void *mem, int c, twr_size_t n);
void *twr_memcpy(void *dest, const void * src, twr_size_t n);

int twr_rand();
void twr_srand(int seed);
#define TWR_RAND_MAX UINT16_MAX

int twr_minint(int a, int b);
int twr_maxint(int a, int b);

int twr_isnan(double v);
int twr_isinf(double v);
double twr_nanval();
double twr_infval();
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
void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args);
int twr_snprintf(char* buffer, int size, char* format, ...);
void twr_printf(char* format, ...);

void twr_set_stdio_con(struct IoConsole *setto);
int twr_getchar();
char* twr_gets(char* buffer);

int twr_malloc_unit_test();
int twr_string_unit_test();
int twr_char_unit_test();
int twr_rand_unit_test();
int twr_misc_unit_test();
int twr_num_int_unit_test();
int twr_fcvt_unit_test();
int twr_atof_unit_test();
int twr_float_unit_test();
int twr_pretty_unit_test();
int twr_printf_unit_test();

#endif

