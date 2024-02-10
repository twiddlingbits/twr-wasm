/**
 * Implementation of log function from math library
 * Uses Newton-Raphson method for calculation and approximation of result
**/
#include "s21_math.h"

long double s21_log(double x) {
    long double res = 1;
    if (is_nan(x)) {
        res = x < 0 ? -S21_NAN : S21_NAN;
    } else if (is_inf(x)) {
        res = x < 0 ? -S21_NAN : S21_INF;
    } else if (x < 0) {
        res = S21_NAN;
    } else if (x == 0) {
        res = -S21_INF;
    } else {
        long double num = x;
        long double p = 0;
        int invert = num < 1.0l;
        if (invert) num = 1.0l / num;
        while (num > S21_E) {
            num /= S21_E;
            p++;
        }
        for (int i = 0; i < 256; i++) {
            res = res + 2 * (num - s21_exp(res)) / (num + s21_exp(res));
        }
        res += p;
        if (invert) res = -res;
    }
    return res;
}
