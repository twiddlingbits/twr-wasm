#include "s21_math.h"
#include <stdint.h>
#include <string.h>

long double s21_ceil(double x) {
    uint64_t input;
    memcpy(&input, &x, 8);
    int exponent = ((input >> 52) & 0x7ff) - 1023;
    if (exponent >= 0) {
        int fractional_bits = 52 - exponent;
        if (fractional_bits > 0) {
            uint64_t integral_mask = 0xffffffffffffffff << fractional_bits;
            uint64_t output = input & integral_mask;
            memcpy(&x, &output, 8);
            if (x > 0 && output != input) x += 1.0;
        }
    } else {
        x = x > 0;
    }
    return x;
}
