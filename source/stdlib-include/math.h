#ifndef __TINY_MATH_H__
#define __TINY_MATH_H__

#ifdef __wasm__

#include "twr-wasm.h"

#ifdef __cplusplus
extern "C" {
#endif

#pragma message "math.h sin & cos"
#pragma message __FILE__

static inline int abs(int n) {return twr_wasm_abs(n); }
static inline double acos(double arg) {return twr_wasm_acos(arg);}
static inline double asin(double arg) {return twr_wasm_asin(arg);}
static inline double atan(double arg) {return twr_wasm_atan(arg);}
static inline double ceil(double arg) {return twr_wasm_ceil(arg);}
static inline double cos(double arg) {return twr_wasm_cos(arg);}
static inline double exp(double arg) {return twr_wasm_exp(arg);}
static inline double fabs(double arg) {return twr_wasm_fabs(arg);}
static inline double floor(double arg) {return twr_wasm_floor(arg);}
static inline double fmod(double x, double y) {return twr_wasm_fmod(x, y);}
static inline double log(double arg) {return twr_wasm_log(arg);}
static inline double pow(double base, double exp) {return twr_wasm_pow(base, exp);}
static inline double sin(double arg) {return twr_wasm_sin(arg);}
static inline double sqrt(double arg) {return twr_wasm_sqrt(arg);}
static inline double tan(double arg) {return twr_wasm_tan(arg);}
static inline double trunc(double arg) {return twr_wasm_trunc(arg);}

#ifdef __cplusplus
}
#endif

#define FP_NAN 0
#define FP_INFINITE 1
#define FP_ZERO 2
#define FP_SUBNORMAL 3
#define FP_NORMAL 4

#define MATH_ERRNO 1
#define MATH_ERREXCEPT 2

#define HUGE_VAL __builtin_huge_val()
#define INFINITY __builtin_inf()
#define NAN __builtin_nanf("")

// These must be type-generic functions.  The C standard specifies them as
// being macros rather than functions, in fact.  However, in C++ it's important
// that there be function declarations that don't interfere with other uses of
// the identifier, even in places with parentheses where a function-like macro
// will be expanded (such as a function declaration in a C++ namespace).

#ifdef __cplusplus

template <typename T> inline constexpr bool isfinite(T x) {
  return __builtin_isfinite(x);
}

template <typename T> inline constexpr bool isinf(T x) {
  return __builtin_isinf(x);
}

template <typename T> inline constexpr bool isnan(T x) {
  return __builtin_isnan(x);
}

#else  // not __cplusplus

#define isfinite(x) __builtin_isfinite(x)
#define isinf(x) __builtin_isinf(x)
#define isnan(x) __builtin_isnan(x)

#endif

#else  //not __wasm__
#pragma message "s21_ math selected in TINY_MATH_H"

#include "s21_math.h"

#define abs(x) s21_abs(x)
#define acos(x) s21_acos(x)
#define asin(x) s21_asin(x)
#define atan(x) s21_atan(x)
#define ceil(x) s21_ceil(x)
#define cos(x) s21_cos(x)
#define exp(x) s21_exp(x)
#define fabs(x) s21_fabs(x)
#define floor(x) s21_floor(x)
#define fmod(x) s21_fmod(x)
#define log(x) s21_log(x)
#define pow(x,y) s21_pow(x,y)
#define sin(x) s21_sin(x)
#define sqrt(x) s21_sqrt(x)
#define tan(x) s21_tan(x)
#define trunc(x) s21_trunc(x)
#endif

#endif
