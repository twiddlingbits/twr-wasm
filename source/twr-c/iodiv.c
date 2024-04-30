#include "twr-io.h"
#include "twr-jsimports.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


static void putc(struct IoConsole* io, char c)
{
	UNUSED(io);
	twrDivCharOut(c);
}

static int getc(struct IoConsole* io)
{
	UNUSED(io);
	return twrDivCharIn();
}

static struct IoConsole io={
	{0,0,0,0},	// header
	{getc}, 	// charin
	{putc}   	// charout
};

struct IoConsole* twr_divcon()
{
	return &io;
}



