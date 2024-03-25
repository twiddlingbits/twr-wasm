#include "twr-crt.h"
#include "twr-wasm.h"

double twr_atod(const char* str) {
    return twrAtod(str);
}

void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision) {
    twrDtoa(buffer, buffer_size, value, max_precision);
}

void twr_wasm_tofixed(char* buffer, int buffer_size, double value, int dec_digits) {
    twrToFixed(buffer, buffer_size, value, dec_digits);
}

void twr_wasm_toexponential(char* buffer, int buffer_size, double value, int dec_digits) {
    twrToExponential(buffer, buffer_size, value, dec_digits);
}

int twr_fcvt_s(
   char* buffer,
   unsigned long sizeInBytes, //twr_size_t
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
) {
    return twrFcvtS(buffer, sizeInBytes, value, fracpart_numdigits, dec, sign);
}