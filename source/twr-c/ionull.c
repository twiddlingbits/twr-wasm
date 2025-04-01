#include "twr-io.h"
#include <stddef.h>  /* NULL*/

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif

static void IoNullPutc(twr_ioconsole_t* io, unsigned char c)
{
	UNUSED(io);
	UNUSED(c);
	
	return;
}


static char IoNullInkey(twr_ioconsole_t* io)
{
	UNUSED(io);
	return 0;
}


static int IoNullGetc(twr_ioconsole_t* io)
{
	UNUSED(io);
	return 0;
}


static int IoNullChkBrk(twr_ioconsole_t* io)
{
	UNUSED(io);
	return 0;  // no break
}

twr_ioconsole_t* io_nullcon()
{
	static twr_ioconsole_t ionull;  // inits to zero

	ionull.charin.io_inkey	= IoNullInkey;
	ionull.charin.io_getc32	= IoNullGetc;
	ionull.charout.io_putc	= IoNullPutc;
	ionull.header.io_chk_brk= IoNullChkBrk;
	ionull.header.type=IO_TYPE_CHARWRITE|IO_TYPE_CHARREAD;

	return &ionull;
}