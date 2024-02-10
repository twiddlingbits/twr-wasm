#include <stddef.h>
#include "twr-crt.h"

static struct IoConsole *twr_stdio;

void twr_set_stdio_con(struct IoConsole *setto) {
	twr_stdio=setto; 
}

struct IoConsole * twr_get_stdio_con() {
	if (twr_stdio==NULL)
		twr_stdio=twr_get_nullcon();

	return twr_stdio;
}


int twr_getchar() {
	return io_getc(twr_get_stdio_con());
}

char* twr_gets(char* buffer) {
	return io_gets(twr_get_stdio_con(), buffer);
}


