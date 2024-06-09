#include <stddef.h>
#include "twr-crt.h"

static struct IoConsole *__stdio, *__dbgout;

void twr_set_stdio_con(struct IoConsole *setto) {
	__stdio=setto; 
}

void twr_set_stderr_con(struct IoConsole *setto) {
	__dbgout=setto; 
}

struct IoConsole * twr_get_stdio_con() {
	if (__stdio==NULL)
		__stdio=io_nullcon();

	return __stdio;
}

struct IoConsole * twr_get_stderr_con() {
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


