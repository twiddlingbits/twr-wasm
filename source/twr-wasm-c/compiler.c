#include "twr-wasm.h"
#include "twr-crt.h"


// assert.h calls this function.  
// normally implemented by libgcc or similar
void _assert (const char *_Message, const char *_File, unsigned _Line) {
    struct IoConsole *con=twr_wasm_get_debugcon();  // Web Browser debug console
    io_printf(con, "assert in file %s at line %d. ", _File, _Line);
    if (_Message) io_putstr(con, _Message);
    io_putc(con, '\n');
}


// clang compiler generates calls to memcpy which is a "clang builtin"
void * memcpy(void *dest, const void *src, unsigned long n) {
    return twr_memcpy(dest, src, n);
}

