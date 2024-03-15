#include "twr-crt.h"
#include "math.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


int tests() {

    twr_printf("starting unit tests of tiny wasm runtime...\n");

    if (twr_char_unit_test()==0)
        twr_printf("char unit test failed\n");
    if (twr_malloc_unit_test()==0)
        twr_printf("malloc unit test failed\n");
    if (twr_string_unit_test()==0)
        twr_printf("string unit test failed\n");
    if (twr_rand_unit_test()==0)
        twr_printf("rand unit test failed\n");
    if (twr_misc_unit_test()==0)
        twr_printf("misc unit test failed\n");
    if (twr_num_int_unit_test()==0)
        twr_printf("number int unit test failed\n");
    if (twr_fcvt_unit_test()==0)
        twr_printf("fcvt unit test failed\n");
    if (twr_atof_unit_test()==0)
        twr_printf("atof unit test failed\n");
    if (twr_dtoa_unit_test()==0)
        twr_printf("dtoa unit test failed\n");
    if (twr_printf_unit_test()==0)
        twr_printf("printf unit test failed\n");
        
    twr_printf("test run complete\n");
    return 0;
}

double sin_test() {
    int i;
    double sum=0;

    for (i=0; i<2000000; i++)
        sum=sum+sin(i);

    return sum;
}
