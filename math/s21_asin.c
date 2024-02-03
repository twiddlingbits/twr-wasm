#include "s21_math.h"

static const double ASIN_EPS = 1e-16l;

long double s21_asin_x_0_05(double x) {
    int i = 3;
    double numerator = x;
    double div_result = 1;
    double result = x;
    double divisor = 1;

    do {
        divisor *= i - 1;
        numerator *= x * x * (i - 2);
        div_result = numerator / (divisor * i);
        result += div_result;
        i += 2;
    } while (div_result > ASIN_EPS);
    return result;
}

long double s21_asin(double x) {
    long double result;

    if (x >= -1 - ASIN_EPS && x <= 1 + ASIN_EPS) {
        int sign;
        if (x >= 0) {
            sign = 1;
        } else {
            x *= -1;
            sign = -1;
        }
        if (x < 0.5) {
            result = s21_asin_x_0_05(x);
        } else {
            result = S21_PI / 2 - 2 * s21_asin_x_0_05(s21_pow((1 - x) / 2, 0.5));
        }
        result *= sign;
    } else {
        result = S21_NAN;
    }
    return result;
}

