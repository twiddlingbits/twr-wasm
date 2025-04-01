#include <stddef.h>
#include "twr-crt.h"

static twr_ioconsole_t *__stdio, *__dbgout;

void twr_set_stdio_con(twr_ioconsole_t *setto) {
	__stdio=setto; 
}

void twr_set_stderr_con(twr_ioconsole_t *setto) {
	__dbgout=setto; 
}

twr_ioconsole_t * twr_get_stdio_con() {
	if (__stdio==NULL)
		__stdio=io_nullcon();

	return __stdio;
}

twr_ioconsole_t * twr_get_stderr_con() {
	if (__stdio==NULL)
		__stdio=io_nullcon();

	return __dbgout;
}

int twr_getc32() {
	return io_getc32(twr_get_stdio_con());
}

char* twr_mbgets(char* buffer) {
	return io_mbgets(twr_get_stdio_con(), buffer);
}


