#include "twr-io.h"
#include "twr-jsimports.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


static void divputc(struct IoConsole* io, unsigned char c)
{
	UNUSED(io);
	twrDivCharOut(c, __get_code_page( __get_lconv_lc_ctype( __get_current_locale() ) ));
}

static int divgetc(struct IoConsole* io)
{
	UNUSED(io);
	return twrDivCharIn();
}

static struct IoConsole io={
	{0,0,0,0},	// header
	{divgetc}, 	// charin
	{divputc}   	// charout
};

struct IoConsole* twr_divcon()
{
	return &io;
}



