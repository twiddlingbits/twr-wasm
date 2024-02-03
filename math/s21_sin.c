#include "s21_math.h"

static const double SIN_EPS = 1e-6l;

long double s21_sin(double x) {
    x = s21_fmod(x, 2 * S21_PI);

    int i = 1;
    double numerator = x;
    double divisor = 1;
    double div_result = 1;
    double result = x;

    do {
        divisor *= ((i << 1) * ((i << 1) + 1));
        numerator *= -1 * x * x;
        div_result = numerator / divisor;
        result += div_result;
        i++;
    } while (s21_fabs(div_result) > SIN_EPS);

    return result;
}

