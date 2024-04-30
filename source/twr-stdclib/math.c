#include <math.h>
#include "twr-jsimports.h"

int abs(int n) {
    if (n<0) return -n;
    else return n;
}

double fabs (double arg) {
    return twrFAbs(arg);
}

double acos(double arg) {
    return twrACos(arg);
}

double asin(double arg) {
    return twrASin(arg);
}

double atan(double arg) {
    return twrATan(arg);
}

double cos(double rad) {
    return twrCos(rad);
}

double sin(double rad) {
    return twrSin(rad);
}

double tan(double rad) {
    return twrTan(rad);
}

double exp(double arg) {
    return twrExp(arg);
}

double floor(double arg) {
    return twrFloor(arg);
}

double ceil(double arg) {
    return twrCeil(arg);
}

double fmod( double x, double y ) {
    return twrFMod(x,y);
}

double log(double arg) {
    return twrLog(arg);
}

double pow( double base, double exponent ) {
    return twrPow(base, exponent);
}

double sqrt(double arg) {
    return twrSqrt(arg);
}

double trunc(double arg) {
    return twrTrunc(arg);
}

