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

double atan2(double y, double x) {
   return twrATan2(y, x);
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

// math smoke tests.  Not comprehensive, because these call JavaScript which presumably has its own tests
int math_unit_test() {

   if (sqrt(4)!=2) return 0;
   if (sqrt(6.25)!=2.5) return 0;

   if (trunc(5.7) !=5.000) return 0;
   if (trunc(-5.7) !=-5.000) return 0;

   if (ceil(5.7) !=6.000) return 0;
   if (ceil(-5.7) !=-5.000) return 0;

   if (floor(5.7) !=5.000) return 0;
   if (floor(-5.7) !=-6.000) return 0;

   if (pow(2.0, 3.0)!=8.0) return 0;

   if (log(1)!=0) return 0;

   if (fmod(10.0, 3.0)!=1.0) return 0;

   if (exp(0)!=1.0) return 0;

   if (tan(0)!=0) return 0;

   if (sin(0)!=0) return 0;

   if (cos(0)!=1) return 0;

   if (abs(5)!=5) return 0;
   if (abs(-5)!=5) return 0;

   if (fabs(1.0)!=1.0) return 0;
   if (fabs(-1.0)!=1.0) return 0;

   if (atan(0)!=0) return 0;

   if (asin(0)!=0) return 0;

   if (acos(1)!=0) return 0;

   return 1;
}

