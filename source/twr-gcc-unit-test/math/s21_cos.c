#include "s21_math.h"

static const double COS_EPS = 1e-6l;

long double s21_cos(double x) {
    double result = 0;
    if (!is_inf(x) && !is_nan(x)) {
        x = s21_fmod(x, 2 * S21_PI);
        double i = 1;
        double step = 1;
        result = 1;
        while (s21_fabs(step) > COS_EPS) {
            step *= -x * x / ((2 * i - 1) * (2 * i));
            result += step;
            i++;
        }
    } else {
        result = S21_NAN;
    }
    return result;
}

