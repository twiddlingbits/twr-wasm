#include "twr-io.h"
#include "twr-jsimports.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif

static void dbgputc(struct IoConsole* io, unsigned char c)
{
	UNUSED(io);
	twrDebugLog(c);
	//twrSleep(1);  // hack to ensure msg prints to console before crash.  only works/needed on async mod.
}

static struct IoConsole io={
	{0,0,0,0},	// header
	{0},		// charin
	{dbgputc}   	// charout
};

struct IoConsole* twr_debugcon()
{
	return &io;
}



