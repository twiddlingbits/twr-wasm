#include <stddef.h>
#include "twr-crt.h"

static struct IoConsole *twr_stdio, *twr_dbgout;

void twr_set_stdio_con(struct IoConsole *setto) {
	twr_stdio=setto; 
}

void twr_set_dbgout_con(struct IoConsole *setto) {
	twr_dbgout=setto; 
}

struct IoConsole * twr_get_stdio_con() {
	if (twr_stdio==NULL)
		twr_stdio=twr_get_nullcon();

	return twr_stdio;
}

struct IoConsole * twr_get_dbgout_con() {
	if (twr_stdio==NULL)
		twr_stdio=twr_get_nullcon();

	return twr_dbgout;
}

int twr_getchar() {
	return io_getc(twr_get_stdio_con());
}

char* twr_gets(char* buffer) {
	return io_gets(twr_get_stdio_con(), buffer);
}


