#include "s21_math.h"

static const double POW_EPS = 1e-100l;

long double s21_pow(double base, double exp) {
    long double res = 1;
    if (s21_fabs(exp) <= POW_EPS) {
        res = 1.0l;
    } else if (s21_fabs(base) <= POW_EPS && exp > 0) {
        res = 0.0l;
    } else if (s21_fabs(base - 1.0) <= POW_EPS) {
        res = 1.0l;
    } else if (is_nan(base) || is_nan(exp)) {
        res = S21_NAN;
    } else if (base < 0 && s21_fabs(s21_fmod(exp, 1.0)) > POW_EPS) {
        res = -S21_NAN;
    } else if (is_inf(base) && base < 0 && s21_fabs(s21_fmod(exp, 2.0)) > POW_EPS) {
        res = -S21_INF;
    } else if (is_inf(base) && base < 0 && s21_fmod(exp, 2.0) <= POW_EPS && exp > 0) {
        res = S21_INF;
    } else if (is_inf(base) && base < 0 && exp < 0) {
        res = 0.0l;
    } else if (is_inf(base) && base < 0 && exp > 0) {
        res = S21_INF;
    } else if (is_inf(base) && base > 0 && exp < 0) {
        res = 0.0l;
    } else if (is_inf(base) && base > 0 && exp > 0) {
        res = S21_INF;
    } else if (s21_fabs(base) <= POW_EPS && base >= 0 && exp < 0) {
        res = S21_INF;
    } else if (s21_fabs(base) <= POW_EPS && base >= 0) {
        res = 0.0l;
    } else if (base < 0 && s21_fabs(base) - 1 <= POW_EPS && is_inf(exp)) {
        res = 1.0l;
    } else if ((s21_fabs(base) - 1 < POW_EPS && is_inf(exp) && exp < 0) ||
               (s21_fabs(base) - 1 > POW_EPS && is_inf(exp) && exp > 0)) {
        res = S21_INF;
    } else if ((s21_fabs(base) - 1 > POW_EPS && is_inf(exp) && exp < 0) ||
               (s21_fabs(base) - 1 < POW_EPS && is_inf(exp) && exp > 0)) {
        res = 0.0l;

    } else {
        int neg_base = base < 0;
        int neg_pow = exp < 0;
        if (neg_base) base = -base;
        if (neg_pow) exp = -exp;
        res = s21_exp(exp * s21_log(base));
        if (neg_base && s21_fabs(s21_fmod(exp, 2.0)) > POW_EPS) res = -res;
        if (neg_pow) res = 1. / res;
    }
    return res;
}
