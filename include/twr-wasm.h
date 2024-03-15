#ifndef __TWR_WASM_H__
#define __TWR_WASM_H__

#include "twr-io.h"
#include "twr-draw2d.h"

#ifdef __cplusplus
extern "C" {
#endif

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon();

void twr_wasm_sleep(int ms);
unsigned long twr_wasm_time(unsigned long *time);


/* WebAssembly.ModuleExports (C functions used by tiny-wasm-runtime TS code)  */
/* not generally used directly by applications -- use TS classes twrWasmModule and twrWasmModuleAsync */
void twr_wasm_init(int pf, unsigned long mem_size); 
void twr_wasm_print_mem_debug_stats();

/* WebAssembly.ModuleImports (Javascript/Typescript functions callable by C code) */
/* these are not generally used directly by applications -- use the twr_wasm_() functions */
extern void twrDivCharOut(int c);   
extern int twrDivCharIn();

extern int twrCanvasGetProp(const char *);
extern void twrCanvasDrawSeq(struct d2d_draw_seq *);
extern int twrCanvasCharIn();
extern int twrCanvasInkey();

extern void twrSleep(int ms);
extern int twrDebugLog(int c);	
extern int twrTime();

extern double twrFAbs(double arg);
extern double twrACos(double arg);
extern double twrASin(double arg);
extern double twrATan(double arg);
extern double twrCos(double rad);
extern double twrSin(double rad);
extern double twrTan(double rad);
extern double twrExp(double arg);
extern double twrFloor(double arg);
extern double twrCeil(double arg);
extern double twrFMod(double x,double y);
extern double twrLog(double arg);
extern double twrPow(double base, double exponent);
extern double twrSqrt(double arg);
extern double twrTrunc(double arg);

extern double twrAtod(const char* str);
extern void twrDtoa(char* buffer, int buffer_size, double value, int max_precision);
extern int twrFcvtS(
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

double twr_atod(const char* str);
void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision);
int twr_fcvt_s(
   char* buffer,
   unsigned long sizeInBytes,  //twr_size_t
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
);

#ifdef __cplusplus
}
#endif

#endif





