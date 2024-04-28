#ifndef __TWR_WASM_H__
#define __TWR_WASM_H__

#include "twr-io.h"
#include "twr-draw2d.h"

#include <stddef.h>  // size_t

#ifdef __cplusplus
extern "C" {
#endif

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_divcon(void);
struct IoConsole* twr_wasm_get_debugcon(void);
struct IoConsole* twr_wasm_get_windowcon(void);

void twr_wasm_sleep(int ms);
uint64_t twr_wasm_time();
void twr_wasm_tofixed(char* buffer, int buffer_size, double value, int dec_digits);
void twr_wasm_toexponential(char* buffer, int buffer_size, double value, int dec_digits);

/* WebAssembly.ModuleExports (C functions used by tiny-wasm-runtime TS code)  */
/* not generally used directly by applications -- use TS classes twrWasmModule and twrWasmModuleAsync */
void twr_wasm_init(int pf, unsigned long mem_size); 
void twr_wasm_print_mem_debug_stats(void);

/* WebAssembly.ModuleImports (Javascript/Typescript functions callable by C code) */
/* these are not generally used directly by applications -- use the twr_wasm_() functions */
__attribute__((import_name("twrDivCharOut"))) void twrDivCharOut(int c);   
__attribute__((import_name("twrDivCharIn"))) int twrDivCharIn(void);
__attribute__((import_name("twrCanvasGetProp"))) int twrCanvasGetProp(const char *);
__attribute__((import_name("twrCanvasDrawSeq"))) void twrCanvasDrawSeq(struct d2d_draw_seq *);
__attribute__((import_name("twrCanvasCharIn"))) int twrCanvasCharIn(void);
__attribute__((import_name("twrCanvasInkey"))) int twrCanvasInkey(void);

__attribute__((import_name("twrSleep"))) void twrSleep(int ms);
__attribute__((import_name("twrDebugLog"))) int twrDebugLog(int c);	
__attribute__((import_name("twrTime"))) double twrTime(); // 64 bit ms since epoch

__attribute__((import_name("twrFAbs"))) double twrFAbs(double arg);
__attribute__((import_name("twrACos"))) double twrACos(double arg);
__attribute__((import_name("twrASin"))) double twrASin(double arg);
__attribute__((import_name("twrATan"))) double twrATan(double arg);
__attribute__((import_name("twrCos"))) double twrCos(double rad);
__attribute__((import_name("twrSin"))) double twrSin(double rad);
__attribute__((import_name("twrTan"))) double twrTan(double rad);
__attribute__((import_name("twrExp"))) double twrExp(double arg);
__attribute__((import_name("twrFloor"))) double twrFloor(double arg);
__attribute__((import_name("twrCeil"))) double twrCeil(double arg);
__attribute__((import_name("twrFMod"))) double twrFMod(double x,double y);
__attribute__((import_name("twrLog"))) double twrLog(double arg);
__attribute__((import_name("twrPow"))) double twrPow(double base, double exponent);
__attribute__((import_name("twrSqrt"))) double twrSqrt(double arg);
__attribute__((import_name("twrTrunc"))) double twrTrunc(double arg);

__attribute__((import_name("twrAtod"))) double twrAtod(const char* str);
__attribute__((import_name("twrToFixed"))) double twrToFixed(char* buffer, int buffer_size, double value, int dec_digits);
__attribute__((import_name("twrToExponential"))) void twrToExponential(char* buffer, int buffer_size, double value, int dec_digits);

__attribute__((import_name("twrDtoa"))) void twrDtoa(char* buffer, int buffer_size, double value, int max_precision);
__attribute__((import_name("twrFcvtS"))) int twrFcvtS(
   char* buffer,
   unsigned long sizeInBytes,  //twr_size_t 
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
);

int twr_wasm_abs(int n);
double twr_wasm_fabs (double a);
double twr_wasm_acos(double arg);
double twr_wasm_asin(double arg);
double twr_wasm_atan(double arg);
double twr_wasm_cos(double rad);
double twr_wasm_sin(double rad);
double twr_wasm_tan(double rad);
double twr_wasm_exp(double arg);
double twr_wasm_floor(double arg);
double twr_wasm_ceil(double arg);
double twr_wasm_fmod(double x, double y);
double twr_wasm_log(double arg);
double twr_wasm_pow( double base, double exponent);
double twr_wasm_sqrt(double arg);
double twr_wasm_trunc(double arg);

_Noreturn void twr_wasm_trap(void);

// compiler support routines
void *memcpy(void *dest, const void * src, size_t n);
void *memset(void *mem, int c, size_t n);

#ifdef __cplusplus
}
#endif

#endif





