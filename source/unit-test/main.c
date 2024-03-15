#include <stdio.h>
#include "twr-crt.h"
#include "float/twr-float-util.h"

// these unit tests are for gcc build
// clang has tests in examples/tests

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif

static void PutC(struct IoConsole* io, char c)
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
    if (twr_big_run_unit_tests()==0)
        twr_printf("bigint unit test failed\n");
    if (twr_num_int_unit_test()==0)
        twr_printf("number int unit test failed\n");
    if (!twr_float_unit_test())
        twr_printf("float unit test failed\n");
    if (twr_fcvt_unit_test()==0)
        twr_printf("fcvt unit test failed\n");
    if (twr_atof_unit_test()==0)
        twr_printf("atof unit test failed\n");
    if (twr_dtoa_unit_test()==0)
        twr_printf("twr_dtoa_unit_test unit test failed\n");
    if (twr_printf_unit_test()==0)
        twr_printf("printf unit test failed\n");
        
    twr_printf("test run complete\n");
    return 0;
}
