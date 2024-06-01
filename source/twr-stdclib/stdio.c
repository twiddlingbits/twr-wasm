#include <stddef.h>
#include "twr-crt.h"

static struct IoConsole *__stdio, *__dbgout;

void twr_set_stdio_con(struct IoConsole *setto) {
	__stdio=setto; 
}

void twr_set_dbgout_con(struct IoConsole *setto) {
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

int twr_getchar() {
	return io_getc(twr_get_stdio_con());
}

char* twr_gets(char* buffer) {
	return io_gets(twr_get_stdio_con(), buffer);
}


