#include "twr-wasm.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


static void putc(struct IoConsole* io, char c)
{
	UNUSED(io);
	twrStdout(c);
}

static int getc(struct IoConsole* io)
{
	UNUSED(io);
	return twrStdin();
}

static struct IoConsole io={
	{0,0,0,0},	// header
	{getc}, 	// charin
	{putc}   	// charout
};

struct IoConsole* twr_wasm_get_stdiocon()
{
	return &io;
}



