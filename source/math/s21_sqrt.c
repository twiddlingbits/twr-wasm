/**
 * Implementation of sqrt function from math library.
**/
#include "s21_math.h"

static const long double SQRT_EPS = 1e-20l;

long double s21_sqrt(double x) {
    long double res = 0;
    if (x < 0) {
        res = -S21_NAN;
    } else if (is_nan(x)) {
        res = S21_NAN;
    } else if (is_inf(x) || x <= SQRT_EPS) {
        res = x;
    } else {
        res = s21_exp(s21_log(x) / 2.);
    }
    return res;
}
