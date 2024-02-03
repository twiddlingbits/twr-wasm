/**
 * Implementation of exp function from math lib.
 * Uses Tailor series for calculation and aproximation of result
**/

#include "s21_math.h"

static const long double EXP_EPS = 1e-100;

long double s21_exp(double x) {
    long double res = 1;
    if (is_nan(x)) {
        res = x < 0 ? -S21_NAN : S21_NAN;
    } else if (is_inf(x)) {
        res = x < 0 ? 0 : S21_INF;
    } else {
        long double num = x;
        long double fact = 1;
        long double step = 1;
        while (s21_fabs(step) > EXP_EPS) {
            step *= num / fact;
            res += step;
            fact++;
        }
    }
    return res;
}
