#include <assert.h>
#include <stdio.h>
#include "twr-crt.h"


// assert.h calls this function.  
// normally implemented by libgcc or twr.a or similar
void _assert (const char *_Message, const char *_File, unsigned _Line) {
    io_printf(stderr, "assert in file %s at line %d. ", _File, _Line);
    if (_Message) io_putstr(stderr, _Message);
    io_putc(stderr, '\n');
}


