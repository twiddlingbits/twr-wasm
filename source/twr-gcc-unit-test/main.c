#include <stdio.h>
#include "twr-crt.h"
#include "float/twr-float-util.h"

// these unit tests are for gcc build
// clang has tests in examples/tests

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif

static void PutC(struct IoConsole* io, unsigned char c)
{
	UNUSED(io);
	putchar(c);
}
	
static struct IoConsole io;

void init_printfcon()
{
	io.charout.io_putc	= PutC;
	twr_set_stdio_con(&io);
	twr_set_dbgout_con(&io);
}

int main() {
    init_printfcon();  

    printf("starting unit tests of tiny wasm runtime...\n");

    if (malloc_unit_test()==0)
        printf("malloc unit test failed\n");
    if (locale_unit_test()==0)
        printf("locale unit test failed\n");
    if (char_unit_test()==0)
        printf("char unit test failed\n");
    if (string_unit_test()==0)
        printf("string unit test failed\n");
    if (twr_rand_unit_test()==0)
        printf("rand unit test failed\n");
    if (stdlib_unit_test()==0)
        printf("misc unit test failed\n");
    if (twr_big_run_unit_tests()==0)
        printf("bigint unit test failed\n");
    if (cvtint_unit_test()==0)
        printf("cvtint unit test failed\n");
    if (cvtfloat_unit_test()==0)
        printf("cvtint unit test failed\n");
    if (!twr_float_unit_test())
        printf("float unit test failed\n");
    if (fcvt_unit_test()==0)
        printf("fcvt unit test failed\n");
    if (twr_atof_unit_test()==0)
        printf("atof unit test failed\n");
    if (twr_dtoa_unit_test()==0)
        printf("twr_dtoa_unit_test unit test failed\n");
    if (printf_unit_test()==0)
        printf("printf unit test failed\n");
    if (time_unit_tests()==0)
        printf("time unit test failed\n");
    if (strftime_unit_test()==0)
        printf("strftime unit test failed\n");
		          
    printf("test run complete\n");
    return 0;
}
