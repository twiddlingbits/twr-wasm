#ifndef __TWR_MATH_H__
#define __TWR_MATH_H__

#ifdef __cplusplus
extern "C" {
#endif

int abs(int n);
double acos(double arg);
double asin(double arg);
double atan(double arg);
double atan2(double y, double x);
double ceil(double arg);
double cos(double arg);
double exp(double arg);
double fabs(double arg);
double floor(double arg);
double fmod(double x, double y);
double log(double arg);
double pow(double base, double exp);
double sin(double arg);
double sqrt(double arg);
double tan(double arg);
double trunc(double arg);

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

#endif  //__cplusplus


#endif  //__TWR_MATH_H__
