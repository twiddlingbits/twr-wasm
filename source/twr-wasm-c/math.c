#include "twr-wasm.h"

int twr_wasm_abs(int n) {
    if (n<0) return -n;
    else return n;
}

double twr_wasm_fabs (double arg) {
    return twrFAbs(arg);

}

double twr_wasm_acos(double arg) {
    return twrACos(arg);
}

double twr_wasm_asin(double arg) {
    return twrASin(arg);
}

double twr_wasm_atan(double arg) {
    return twrATan(arg);
}

double twr_wasm_cos(double rad) {
    return twrCos(rad);
}

double twr_wasm_sin(double rad) {
    return twrSin(rad);
}

double twr_wasm_tan(double rad) {
    return twrTan(rad);
}

double twr_wasm_exp(double arg) {
    return twrExp(arg);
}

double twr_wasm_floor(double arg) {
    return twrFloor(arg);
}

double twr_wasm_ceil(double arg) {
    return twrCeil(arg);
}

double twr_wasm_fmod( double x, double y ) {
    return twrFMod(x,y);
}

double twr_wasm_log(double arg) {
    return twrLog(arg);
}

double twr_wasm_pow( double base, double exponent ) {
    return twrPow(base, exponent);
}

double twr_wasm_sqrt(double arg) {
    return twrSqrt(arg);
}

double twr_wasm_trunc(double arg) {
    return twrTrunc(arg);
}

