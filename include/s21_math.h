/* I took these from https://github.com/Gwarek2/mathlib */

#ifndef S21_MATH_H
#define S21_MATH_H

#define S21_INF __builtin_inf()
#define S21_NAN __builtin_nan("")
#define is_inf __builtin_isinf
#define is_nan __builtin_isnan

#define S21_E 2.718281828459045
#define S21_PI 3.141592653589793
int s21_abs(int x);
long double s21_acos(double x);
long double s21_asin(double x);
long double s21_atan(double x);
long double s21_ceil(double x);
long double s21_cos(double x);
long double s21_exp(double x);
long double s21_fabs(double x);
long double s21_floor(double x);
long double s21_fmod(double x, double y);
long double s21_log(double x);
long double s21_pow(double base, double exp);
long double s21_sin(double x);
long double s21_sqrt(double x);
long double s21_tan(double x);
long double s21_trunc(double x);

#endif
