#ifndef __TINY_MATH_H__
#define __TINY_MATH_H__

#ifdef __cplusplus
extern "C" {
#endif

// if clang, assume WASM build
#ifdef __wasm__
#pragma message "wasm math selected in TINY_MATH_H"

#include "twr-wasm.h"

#define abs(x) twr_wasm_abs(x)
#define acos(x) twr_wasm_acos(x)
#define asin(x) twr_wasm_asin(x)
#define atan(x) twr_wasm_atan(x)
#define ceil(x) twr_wasm_ceil(x)
#define cos(x) twr_wasm_cos(x)
#define exp(x) twr_wasm_exp(x)
#define fabs(x) twr_wasm_fabs(x)
#define floor(x) twr_wasm_floor(x)
#define fmod(x) twr_wasm_fmod(x)
#define log(x) twr_wasm_log(x)
#define pow(x,y) twr_wasm_pow(x,y)
#define sin(x) twr_wasm_sin(x)
#define sqrt(x) twr_wasm_sqrt(x)
#define tan(x) twr_wasm_tan(x)
#define trunc(x) twr_wasm_trunc(x)
#else
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

#ifdef __cplusplus
}
#endif

#endif