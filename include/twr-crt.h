#ifndef __TWR_CRT_H__
#define __TWR_CRT_H__

// this file declares the tiny-wasm-runtime C functions that are not standard C library functions (those are found in 'twr-stdclib/include')

#include <_stdtypes.h> // size_t, locale_t
#include <stdarg.h>  // va_list, etc
#include <stdint.h>	// int64_t

#include "twr-io.h"

#ifdef __cplusplus
extern "C" {
#endif

void twr_init_malloc(void* memp, size_t size_in_bytes);
void twr_malloc_debug_stats(void);
void *twr_cache_malloc(size_t size);
void twr_cache_free(void* mem);

void twr_strhorizflip(char * buffer, int n);

double twr_nanval(void);
double twr_infval(void);

void twr_dtoa(char* buffer, int sizeInBytes, double value, int max_precision);
int64_t twr_atou64(const char *str, int* len, int radix);
int __atosign(const char *str, int* len);
int __atosign_l(const char *str, int* len, locale_t loc);
#define twr_atod(str) atof(str)

typedef void (*twr_vcbprintf_callback)(void* cbdata, unsigned char c);
void twr_vcbprintf(twr_vcbprintf_callback out, void* cbdata, const char *format, va_list vlist);
void twr_conlog(const char* format, ...);

struct IoConsole* twr_divcon(void);
struct IoConsole* twr_debugcon(void);
struct IoConsole* twr_windowcon(void);

void twr_set_stdio_con(struct IoConsole *setto);
void twr_set_dbgout_con(struct IoConsole *setto);
struct IoConsole * twr_get_stdio_con(void);
struct IoConsole * twr_get_dbgout_con(void);
int twr_getchar(void);
char* twr_gets(char* buffer);

_Noreturn void twr_trap(void);

void twr_sleep(int ms);
uint64_t twr_epoch_timems();
void twr_tofixed(char* buffer, int buffer_size, double value, int dec_digits);
void twr_toexponential(char* buffer, int buffer_size, double value, int dec_digits);

/* internal utility function */
void nstrcopy(char *buffer, const int sizeInBytes, const char *outstring, const int sizeofoutstring, int n);

/* unit tests */
int malloc_unit_test(void);
int string_unit_test(void);
int char_unit_test(void);
int rand_unit_test(void);
int stdlib_unit_test(void);
int cvtint_unit_test(void);
int cvtfloat_unit_test(void);
int fcvt_unit_test(void);
int atof_unit_test(void);
int twr_dtoa_unit_test(void);
int printf_unit_test(void);
int time_unit_tests(void);
int strftime_unit_test(void);
int locale_unit_test(void);

#ifdef __cplusplus
}
#endif

#endif

