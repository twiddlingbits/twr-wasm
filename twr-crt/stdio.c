#include <stddef.h>
#include "twr-crt.h"

struct IoConsole *twr_stdio;

void twr_set_stdio_con(struct IoConsole *setto) {
	twr_stdio=setto; 
}

int twr_getchar() {

	if (twr_stdio==NULL)
		twr_stdio=twr_get_nullcon();

	return io_getc(twr_stdio);
}

char* twr_gets(char* buffer) {

	if (twr_stdio==NULL)
		twr_stdio=twr_get_nullcon();

	return io_gets(twr_stdio, buffer);
}


