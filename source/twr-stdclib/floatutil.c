#include <stdlib.h>
#include "twr-crt.h"
#include "twr-jsimports.h"

double atof(const char* str) {
    return twrAtod(str);
}

void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision) {
    twrDtoa(buffer, buffer_size, value, max_precision);
}

void twr_tofixed(char* buffer, int buffer_size, double value, int dec_digits) {
    twrToFixed(buffer, buffer_size, value, dec_digits);
}

void twr_toexponential(char* buffer, int buffer_size, double value, int dec_digits) {
    twrToExponential(buffer, buffer_size, value, dec_digits);
}

int _fcvt_s(
   char* buffer,
   unsigned long sizeInBytes, //size_t
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
) {
    return twrFcvtS(buffer, sizeInBytes, value, fracpart_numdigits, dec, sign);
}

/**************************************************/

// should replace with these stdclib defines in math.h
//#define NAN __builtin_nanf("")
//#define INFINITY __builtin_inf()

double twr_nanval() {
	return __builtin_nan("");
}

double twr_infval() {
	return __builtin_inf();
}