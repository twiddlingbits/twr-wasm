#include <math.h>
#include <stdio.h>
#include <twr-crt.h>

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


int tests() {

    printf("starting unit tests of tiny wasm runtime...\n");

    if (malloc_unit_test()==0)
        printf("malloc unit test failed\n");
    if (locale_unit_test()==0)
        printf("locale unit test failed\n");
    if (rand_unit_test()==0)
        printf("rand unit test failed\n");
    if (stdlib_unit_test()==0)
        printf("misc unit test failed\n");
    if (cvtint_unit_test()==0)
        printf("convert int unit test failed\n");
    if (cvtfloat_unit_test()==0)
        printf("convert float unit test failed\n");
    if (fcvt_unit_test()==0)
        printf("fcvt unit test failed\n");
    if (atof_unit_test()==0)
        printf("atof unit test failed\n");
    if (twr_dtoa_unit_test()==0)
        printf("dtoa unit test failed\n");
	 if (char_unit_test()==0)
        printf("char unit test failed\n");
    if (string_unit_test()==0)
        printf("string unit test failed\n");
    if (printf_unit_test()==0)
        printf("printf unit test failed\n");
    if (time_unit_tests()==0)
        printf("time unit test failed\n");
 		  
    printf("test run complete\n");
    return 0;
}

double sin_test() {
    int i;
    double sum=0;

    for (i=0; i<2000000; i++)
        sum=sum+sin(i);

    return sum;
}
