#include "twr-io.h"
#include "twr-jsimports.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif

static void divputc(struct IoConsole* io, unsigned char c)
{
	UNUSED(io);

	const struct lconv* lcc = __get_lconv_lc_ctype(twr_get_current_locale());
	int cp;
	if (__is_c_locale(lcc))
		cp=TWR_CODEPAGE_UTF8;  // we allow UTF-8 chars that are printf'd or otherwise flow to a console to work
	else
		cp=__get_code_page(lcc);

	twrDivCharOut(c, cp);
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



