#include "twr-wasm.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif

static void putc(struct IoConsole* io, char c)
{
	UNUSED(io);
	twrDebugLog(c);
}

static struct IoConsole io={
	{0,0,0,0},	// header
	{0},		// charin
	{putc}   	// charout
};

struct IoConsole* twr_wasm_get_debugcon()
{
	return &io;
}



