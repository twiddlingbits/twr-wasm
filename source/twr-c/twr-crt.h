#ifndef __TWR_CRT_H__
#define __TWR_CRT_H__

// this file declares the twr-wasm C functions that are not standard C library functions (those are found in 'twr-stdclib/include')

#include <_stdtypes.h> // size_t, locale_t
#include <stdarg.h>  // va_list, etc
#include <stdint.h>	// int64_t

#include "twr-io.h"

#ifdef __cplusplus
extern "C" {
#endif

void twr_init_malloc(void* memp, size_t size_in_bytes);
void twr_malloc_debug_stats(twr_ioconsole_t* outcon);
void *twr_cache_malloc(size_t size);
void twr_cache_free(void* mem);

void twr_mem_debug_stats(twr_ioconsole_t* outcon);

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

twr_ioconsole_t* twr_jscon(int jsid);
twr_ioconsole_t* twr_jscon_singleton(int jsid);
twr_ioconsole_t* twr_get_console(const char* name);
int __twr_get_jsid(twr_ioconsole_t* io);

void twr_set_std2d_con(twr_ioconsole_t *setto);
twr_ioconsole_t * twr_get_std2d_con();

void twr_set_stdio_con(twr_ioconsole_t *setto);
void twr_set_stderr_con(twr_ioconsole_t *setto);
twr_ioconsole_t * twr_get_stdio_con(void);
twr_ioconsole_t * twr_get_stderr_con(void);
int twr_getc32(void);
char* twr_mbgets(char* buffer);

_Noreturn void twr_trap(void);

__attribute__((import_name("twr_sleep"))) void twr_sleep(int ms);
__attribute__((import_name("twrTimeEpoch"))) uint64_t twr_epoch_timems(void);
__attribute__((import_name("twr_timer_single_shot"))) int twr_timer_single_shot(int milliSeconds, int eventID);
__attribute__((import_name("twr_timer_repeat"))) int twr_timer_repeat(int milliSeconds, int eventID);
__attribute__((import_name("twr_timer_cancel"))) void twr_timer_cancel(int timerID);

// does not use locale information; it always uses . (a dot) as the decimal separator.
__attribute__((import_name("twrToFixed"))) double twr_tofixed(char* buffer, int buffer_size, double value, int dec_digits);

// does not use locale information; it always uses . (a dot) as the decimal separator.
__attribute__((import_name("twrToExponential"))) void twr_toexponential(char* buffer, int buffer_size, double value, int dec_digits);

const char* twr_get_navlang(int *len);

int twr_utf8_char_len(const char *str);
size_t twr_mbslen_l(const char *str, locale_t locale);
void twr_utf32_to_code_page(char*out, int utf32);
int twr_code_page_to_utf32_streamed(unsigned char byte);
void twr_localize_numeric_string(char* str, locale_t locale);

/* library functions */
__attribute__((import_name("twr_register_callback"))) int twr_register_callback(const char* func_name);

/* internal utility function */
void __nstrcopy(char *buffer, const int sizeInBytes, const char *outstring, const int sizeofoutstring, int n);

/* unit tests */
int malloc_unit_test(void);
int string_unit_test(void);
int mbstring_unit_test(void);
int char_unit_test(void);
int rand_unit_test(void);
int math_unit_test(void);
int misc_unit_test(void);
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

