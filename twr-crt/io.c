#include <stdarg.h>
#include <stdlib.h>
#include <stddef.h>
#include <ctype.h>
#include <assert.h>

#include "twr-io.h"
#include "twr-crt.h"

/*
 * Console I/O routines.
 *
 * These functions take a pointer to a struct IoConsole, which must be created via a call
 * to a device dependent console creation call.
 * 
 * Two types of consoles are supported:  TTY (serial, stdin/out) and Windowed. 
 * The basic TTY functions (e.g. putc) will work on TTY or Windowed consoles.
 * The Windowed functions (eg. setreset, set_io->header.cursor) only work on windowed consoles.
 * 
 * 	iow->display.io_width and iow->display.io_height are set to zero for TTY devices (stream devices)
 *
 * struct IoConsole contains pointers to device dependent driver functions, as well
 * as variables used by this code.
 *
 * For Example:
 *    struct IoConsole* io = IoWinConOpen();
 *    io_putstr(io, "hello world\n");
 *
 */


//*************************************************

static void erase_line(struct IoConsoleWindow* iow)
{
	for (int i=iow->con.header.cursor; i < (iow->con.header.cursor/iow->display.io_width)*iow->display.io_width+iow->display.io_width; i++)
		io_set_c(iow, i, ' ');
}
		
void io_putc(struct IoConsole* io, char cp)
{
	unsigned char c = *((unsigned char*)&cp);

	if (io->charout.io_putc)
	{
		/*
		 * If a stream device (should always be if here), then maintain the cursor
		 */
		if (io->header.type==0)	// Stream
		{
			if (c==13 || c==10)	// return
			{
				io->header.cursor = 0;
			}
			else if (c==8)	// backspace
			{
				if (io->header.cursor > 0)
					io->header.cursor--;
			}
			else if (c >=192)	// 192 to 255 are shortcuts for 0 to 63 spaces, respectively
			{
				for (int i=0; i < (c-192); i++)
					io_putc(io, ' ');

				return;
			}
			else if (c==24)	/* backspace cursor*/
			{
				if (io->header.cursor > 0)
					io->header.cursor--;
			}
			else if (c==25)	/* advance cursor*/
			{
				io->header.cursor++;
			}
			else
			{
				io->header.cursor++;
			}
		}
		(*io->charout.io_putc)(io, c);
		return;
	}

	assert(io->header.type&IO_TYPE_WINDOW);

	struct IoConsoleWindow* iow=(struct IoConsoleWindow*)io;

	if (c==13 || c==10)	// return
	{
		if (iow->display.cursor_visible)
			io_set_c(iow, io->header.cursor,' ');
		
		io->header.cursor = io->header.cursor/iow->display.io_width;
		io->header.cursor = io->header.cursor*iow->display.io_width;
		io->header.cursor = io->header.cursor + iow->display.io_width;
		
		/* if return put us on a new line that isn't a scroll, erase the line */
		if (io->header.cursor < iow->display.io_width*iow->display.io_height)	
			erase_line(iow);
	}
	else if (c==8)	// backspace
	{
		if (io->header.cursor > 0)
		{
			if (iow->display.cursor_visible)
				io_set_c(iow, io->header.cursor,' ');
			io->header.cursor--;
			io_set_c(iow, io->header.cursor,' ');
		}
	}
	else if (c==0xE)	// Turn on cursor
	{
		iow->display.cursor_visible = TRUE;
	}
	else if (c==0xF)	// Turn off cursor
	{
		io_set_c(iow, io->header.cursor,' ');
		iow->display.cursor_visible = FALSE;
	}
	else if (c >=192)	// 192 to 255 are shortcuts for 0 to 63 spaces, respectively
	{
		for (int i=0; i < (c-192); i++)
			io_putc(io, ' ');
	}
	else if (c==24)	/* backspace cursor*/
	{
		if (io->header.cursor > 0)
			io->header.cursor--;
	}
	else if (c==25)	/* advance cursor*/
	{
		if (io->header.cursor < (iow->display.io_width*iow->display.io_height-1))
			io->header.cursor++;
	}
	else if (c==26)	/* cursor down one line */
	{
		if (io->header.cursor < iow->display.io_width*(iow->display.io_height-1))
			io->header.cursor+=iow->display.io_width;
	}
	else if (c==27)	/* cursor up one line */
	{
		if (io->header.cursor >= iow->display.io_width)
			io->header.cursor-=iow->display.io_width;
	}
	else if (c==28)	/* home */
	{
		io->header.cursor=0;
	}
	else if (c==29)	/* beginning of line */
	{
		io->header.cursor=(io->header.cursor/iow->display.io_width)*iow->display.io_width;
	}
	else if (c==30)	/* erase to end of line */
	{
		erase_line(iow);
	}
	else if (c==31)	/* erase to end of frame */
	{
		for (int i=io->header.cursor; i < iow->display.io_width*iow->display.io_height; i++)
			io_set_c(iow, i, ' ');
	}
	else
	{
		io_set_c(iow, io->header.cursor, c);
		io->header.cursor++;
	}

	// Do we need to scroll?
	if (io->header.cursor == iow->display.io_width*iow->display.io_height)	
	{
		io->header.cursor = iow->display.io_width*(iow->display.io_height-1);
		for (int i=0; i < (iow->display.io_width*(iow->display.io_height-1)); i++)
			iow->display.video_mem[i] = iow->display.video_mem[i+iow->display.io_width];

		for (int i=0; i < iow->display.io_width; i++)
			iow->display.video_mem[iow->display.io_width*iow->display.io_height-i-1] = ' ';

		io_draw_range(iow, 0, iow->display.io_width*iow->display.io_height-1);
	}

	if (iow->display.cursor_visible)
		io_set_c(iow, io->header.cursor, '_');

	if (io->header.cursor >=iow->display.io_width*iow->display.io_height)
	{
		io->header.cursor=0;		// SHOULD NEVER HAPPEN
		io_putstr(io, "INTERR");
	}
}

//*************************************************

char io_inkey(struct IoConsole* io)
{
	if (io->charin.io_inkey)
		return (*io->charin.io_inkey)(io);
	else
		return 0;
}

//*************************************************

int io_getc(struct IoConsole* io)
{
	return (*io->charin.io_getc)(io);
}

//*************************************************

int io_chk_brk(struct IoConsole* io)
{
	if (io->header.io_chk_brk)
		return (*io->header.io_chk_brk)(io);
	else	
		return 0;
}

//*************************************************

void io_close(struct IoConsole* io)
{
	if (io->header.io_close)
		io->header.io_close(io);
}

//*************************************************
void io_cls(struct IoConsoleWindow* iow)
{
	if (iow->display.io_width==0 || iow->display.io_height==0)
		return;

	for (int i=0; i < iow->display.io_width*iow->display.io_height; i++)
		iow->display.video_mem[i]=' ';

	iow->con.header.cursor = 0;
	iow->display.cursor_visible = FALSE;

	io_draw_range(iow, 0, iow->display.io_width*iow->display.io_height-1);
}


//*************************************************

void io_set_c(struct IoConsoleWindow* iow, unsigned short loc, unsigned char c)
{
	if (iow->display.io_width==0 || iow->display.io_height==0)
		return;

	iow->display.video_mem[loc]=c;
	iow->display.io_draw_range(iow, iow->display.video_mem, loc, loc);
}

//*************************************************


unsigned char io_peek(struct IoConsoleWindow* iow, short loc)
{
	if (iow->display.io_width==0 || iow->display.io_height==0)
		return 0;

	/** Video Ram? **/
	if (loc>=0x3c00 && loc<=0x3fff)
		return iow->display.video_mem[loc-0x3c00];
	else if (loc>=0x3801 && loc<=0x3880 && iow->display.io_peek_keyboard)
		return iow->display.io_peek_keyboard(iow, loc);
	else
		return 0;
}

//*************************************************

bool io_setreset(struct IoConsoleWindow* iow, short x, short y, bool isset)
{
	unsigned short loc = x/2+iow->display.io_width*(y/3);
	unsigned char cellx = x%2;
	unsigned char celly = y%3;

	if (loc>=iow->display.io_width*iow->display.io_height)
		return false;

	if (!(iow->display.video_mem[loc]&128))
		iow->display.video_mem[loc]= 128;	/* set to a cleared graphics value */

	if (isset)
		iow->display.video_mem[loc]|= (1<<(celly*2+cellx));
	else
		iow->display.video_mem[loc]&= ~(1<<(celly*2+cellx));


	io_draw_range(iow, loc, loc);

	return true;
}

//*************************************************

short io_point(struct IoConsoleWindow* iow, short x, short y)
{
	unsigned short loc = x/2+iow->display.io_width*(y/3);
	unsigned char cellx = x%2;
	unsigned char celly = y%3;

	if (loc>=iow->display.io_width*iow->display.io_height)
		return 0;		/* -1 = TRUE, 0 = FALSE */

	if (!(iow->display.video_mem[loc]&128))
		return 0;	/* not a graphic cell, so false */

	if (iow->display.video_mem[loc]&(1<<(celly*2+cellx)))
		return -1;	/* -1 - TRS-80 TRUE */
	else 
		return 0;
}


//*************************************************

void io_set_cursor(struct IoConsoleWindow* iow, short i)
{
	if (iow->display.io_width==0 || iow->display.io_height==0)
		return;

	if (i <0) i =0;
	else if (i >= iow->display.io_width*iow->display.io_height) 
		i=iow->display.io_width*iow->display.io_height-1;
	iow->con.header.cursor = i;
}

//*************************************************

short io_get_cursor(struct IoConsole* iow)
{
	return iow->header.cursor?iow->header.cursor:0;
}

//*************************************************


void io_putstr(struct IoConsole* io, const char* str)
{
	for (int i=0; str[i]; i++)		// Otherwise, implement using putc
		io_putc(io, str[i]);
}

//*************************************************

void io_draw_range(struct IoConsoleWindow* iow, int start, int end)
{
	assert (!(iow->display.io_width==0 || iow->display.io_height==0));
	iow->display.io_draw_range(iow, iow->display.video_mem, start, end);
}

//*************************************************

char *io_gets(struct IoConsole* io, char *buffer )
{
	short i=0;
	int c;

	io_putc(io, 0xE);		/* io->header.cursor on */

	while (TRUE)
	{
		c=io_getc(io);
		if (c==	0x1b)		// ESC key
			return NULL;

		if (!(c==0x08 && i == 0))
			io_putc(io, c);

		if (c=='\n' || c=='\r')
		{
			buffer[i]=0;
			io_putc(io, 0xF);		/* io->header.cursor off */
			return buffer;
		}

		else if (c==0x08 && i > 0)
		{
			i--;
		}
		else if (isgraph(c) || c==' ')
		{
			buffer[i++] = c;
		}
	}
}

//*************************************************

void io_printf(struct IoConsole *io, const char *format, ...) {
	va_list args;
	va_start(args, format);

	twr_vprintf((twr_cbprintf_callback)io_putc, io, format, &args);

	va_end(args);
}

//*************************************************

/*
 * PRINT USING format
 *
 * supports all format specifiers except ^ (E&D)
 *
 */

void io_printusingnum(struct IoConsole *io, char* string, double value)
{
	int i=0,adp,ads,numcommas;
	bool dollar=FALSE, astrix=FALSE, postplus=FALSE,postneg=FALSE, preplus=FALSE, comma=FALSE;
	int predec=0, postdec=0, pad;
	char ad[150];

	/*
	 * scan up until the first # 
	 */
	while (TRUE)
	{
		if (string[i]=='*' && string[i+1]=='*')
		{
			astrix = TRUE;
			predec+=2;
			i=i+2;
			if (string[i]=='$')
			{
				i++;
				dollar=TRUE;
			}
			break;
		}
		else if (string[i]=='$' && string[i+1]=='$')
		{
			dollar = TRUE;
			i=i+2;
			break;
		}
		else if (string[i]=='+' && string[i+1]=='#')
		{
			preplus=TRUE;
			i++;
			break;
		}
		else if (string[i]=='.' && string[i+1]=='#')
			break;

		else if (string[i]=='#')
			break;

		else
			io_putc(io, string[i++]);
	}

	/*
	 * scan the # field 
	 */

	while (string[i]==',' || string[i]=='#')
	{
		predec++;
		if (string[i]==',')
			comma = TRUE;
		i++;
	}
	if (string[i]=='.')
	{
		i++;

		while (string[i]=='#')
		{
			postdec++;
			i++;
		}
	}
	/*
	 * any post + o - ?
	 */

	if (string[i]=='-')
		postneg=TRUE;
	else if (string[i]=='+')
		postplus=TRUE;

	/* 
	 * convert the number to ASCII
	 */

	twr_fcvt_s(ad, sizeof(ad), value, postdec, &adp, &ads);

	/*
	 * take all the preceding requirments and generate the output formated string
	 */

	if (adp < 0) adp = 0;
	
	if (comma)
		numcommas=adp/3;
	else
		numcommas=0;

	pad = predec - adp - numcommas;
	if (preplus || ads!=0)
		pad--;	/* the sign will take one space */

	if (pad < 0)
		io_putc(io, '%'); /* error */

	while (pad-- > 0)
	{
		if (astrix)
			io_putc(io, '*');
		else
			io_putc(io, ' ');
	}

	if (predec > 0)
	{
		if (dollar)
			io_putc(io, '$');

		if (ads!=0)	
			io_putc(io, '-');

		if (ads==0 && preplus)
			io_putc(io, '+');

		if (numcommas == 0)
			for (i=0; i < adp; i++)
				io_putc(io, ad[i]);
		else
		{
			int commacount=adp%3;

			for (i=0; i < adp; i++)
			{
				io_putc(io, ad[i]);
				commacount--;
				if (commacount%3==0 && i!=(adp-1))
					io_putc(io, ',');
			}
		}
	}

	if (postdec > 0)
	{
		io_putc(io, '.');
		io_putstr(io, ad+adp);
	}
	if (postneg && ads!=0)
		io_putc(io, '-');

	if (postplus)
	{
		if (ads==0) io_putc(io, '+'); 
		else io_putc(io, '-');
	}
}
