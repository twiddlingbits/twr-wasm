#include <math.h>
#include <stdio.h>
#include <twr-crt.h>

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


int tests() {

	printf("starting unit tests of twr-wasm...\n");

	printf("malloc_unit_test: %s\n", malloc_unit_test()?"success":"FAIL");
	printf("locale_unit_test: %s\n", locale_unit_test()?"success":"FAIL");
	printf("rand_unit_test: %s\n", rand_unit_test()?"success":"FAIL");
	printf("math_unit_test: %s\n", math_unit_test()?"success":"FAIL");
	printf("stdlib_unit_test: %s\n", stdlib_unit_test()?"success":"FAIL");
	printf("cvtint_unit_test: %s\n", cvtint_unit_test()?"success":"FAIL");
	printf("cvtfloat_unit_test: %s\n", cvtfloat_unit_test()?"success":"FAIL");
	printf("fcvt_unit_test: %s\n", fcvt_unit_test()?"success":"FAIL");
	printf("atof_unit_test: %s\n", atof_unit_test()?"success":"FAIL");
	printf("twr_dtoa_unit_test: %s\n", twr_dtoa_unit_test()?"success":"FAIL");
	printf("string_unit_test: %s\n", string_unit_test()?"success":"FAIL");
	printf("printf_unit_test: %s\n", printf_unit_test()?"success":"FAIL");
	printf("mbstring_unit_test: %s\n", mbstring_unit_test()?"success":"FAIL");
   
	
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
