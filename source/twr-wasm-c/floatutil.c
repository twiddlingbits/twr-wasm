#include "twr-wasm.h"

double twr_atod(const char* str) {
    return twrAtod(str);
}

void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision) {
    twrDtoa(buffer, buffer_size, value, max_precision);
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