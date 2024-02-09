#include <stdio.h>

#include "twr-crt.h"

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
        printf("fcvt unit test failed\n");
    if (twr_atof_unit_test()==0)
        printf("atof unit test failed\n");
    if (twr_pretty_unit_test()==0)
        printf("prettyprint unit test failed\n");
    if (twr_printf_unit_test()==0)
        twr_printf("printf unit test failed\n");
        
    twr_printf("test run complete\n");
    return 0;
}
