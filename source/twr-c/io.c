#include <stdarg.h>
#include <stdlib.h>
#include <stddef.h>
#include <ctype.h>
#include <assert.h>
#include <locale.h>
#include <twr-jsimports.h>
#include "twr-io.h"
#include "twr-crt.h"  //twr_vcbprintf

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
 * For stream (TTY) devices,
 * 	iow->display.io_width and iow->display.io_height are set to zero 
 * 	IoConsoleHeader.type == 0 (see twr-io.h)
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
		
void io_putc(struct IoConsole* io, unsigned char c)
{

	if (io->charout.io_putc)
	{
		/*
		 * window devices typically set io->charout.io_putc==NULL
		 * If a stream device (should always be if here), then maintain the cursor
		 */
		if (io->header.type==0)	// Stream
		{
			if (c==13 || c==10)	// return
			{
				io->header.cursor = 0;
			}
			else if (c==8 || c==24)	// backspace || backspace cursor
			{
				if (io->header.cursor > 0)
					io->header.cursor--;
				else
					return;
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
	
	#if 0
	else if (c >=192)	// 192 to 255 are shortcuts for 0 to 63 spaces, respectively
	{
		for (int i=0; i < (c-192); i++)
			io_putc(io, ' ');
	}
	#endif
	
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
		if (io_set_c_l(iow, io->header.cursor, c, twr_get_current_locale()))
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

	if (io->header.cursor >= iow->display.io_width*iow->display.io_height)
	{
		io->header.cursor=0;		// SHOULD NEVER HAPPEN
		assert(0);
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
// returns a unicode code point, but historically was just ASCII, so that is often how it is used (treating result as ascii)
int io_getc(struct IoConsole* io)
{
	return (*io->charin.io_getc)(io);
}

void io_getc_l(struct IoConsole* io, char* strout, locale_t loc)
{
	const int cp = (*io->charin.io_getc)(io);
	const struct lconv* lcc = __get_lconv_lc_ctype(loc);
	const int code_page=__get_code_page(lcc);  //"C" locale is ASCII

	twrUnicodeCodePointToCodePage(strout, cp, code_page);
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

/* accepts a byte stream encoded in the passed code_page. EG, UTF-8 */
/* allow UTF-8 with "C" locale, as does printf,putc (see iodiv.c driver) */
bool io_set_c_l(struct IoConsoleWindow* iow, int location, unsigned char c, locale_t loc)
{
	const struct lconv* lcc = __get_lconv_lc_ctype(twr_get_current_locale());
	int cp;
	if (__is_c_locale(lcc))
		cp=TWR_CODEPAGE_UTF8;  // we allow UTF-8 chars that are printf'd or otherwise flow to a console to work
	else
		cp=__get_code_page(lcc);

	int r=twrCodePageToUnicodeCodePoint(c, cp);
	if (r>0) {
		io_set_c(iow, location, r);
		return true;
	}
	else {
		return false;
	}
}

//*************************************************
/* c is a unicode 32 codepoint */
void io_set_c(struct IoConsoleWindow* iow, int loc, cellsize_t c)
{
	assert (iow->display.io_width!=0 && iow->display.io_height!=0 && (iow->con.header.type&IO_TYPE_WINDOW));

	iow->display.video_mem[loc]=c;
	iow->display.io_draw_range(iow, loc, loc);
}

//*************************************************

bool io_setreset(struct IoConsoleWindow* iow, short x, short y, bool isset)
{
	unsigned short loc = x/2+iow->display.io_width*(y/3);
	unsigned char cellx = x%2;
	unsigned char celly = y%3;

	assert (iow->display.io_width!=0 && iow->display.io_height!=0 && (iow->con.header.type&IO_TYPE_WINDOW));

	if (!((iow->display.video_mem[loc]&TRS80_GRAPHIC_MARKER_MASK)==TRS80_GRAPHIC_MARKER))
		iow->display.video_mem[loc]= TRS80_GRAPHIC_MARKER;	/* set to a cleared graphics value */

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

	if (!((iow->display.video_mem[loc]&TRS80_GRAPHIC_MARKER_MASK)==TRS80_GRAPHIC_MARKER))
		return 0;	/* not a graphic cell, so false */

	if (iow->display.video_mem[loc]&(1<<(celly*2+cellx)))
		return -1;	/* -1 - TRS-80 TRUE */
	else 
		return 0;
}


//*************************************************

void io_set_cursor(struct IoConsoleWindow* iow, int i)
{
	if (iow->display.io_width==0 || iow->display.io_height==0)
		return;

	if (i <0) i=0;
	else if (i >= iow->display.io_width*iow->display.io_height) 
		i=iow->display.io_width*iow->display.io_height-1;
	iow->con.header.cursor = i;
}

//*************************************************

void io_set_cursorxy(struct IoConsoleWindow* iow, int x, int y) {
    if (iow->display.io_width*y+x >= iow->display.io_width*iow->display.io_height)
            io_set_cursor(iow, 0); // out of range, pick an in-range position.
    else {
        io_set_cursor(iow, iow->display.io_width*y+x); 
    }
}

//*************************************************

int io_get_cursor(struct IoConsole* iow)
{
	return iow->header.cursor?iow->header.cursor:0;
}

//*************************************************

void io_putstr(struct IoConsole* io, const char* str)
{
	for (int i=0; str[i]; i++)
		io_putc(io, str[i]);
}

//*************************************************

void io_draw_range(struct IoConsoleWindow* iow, int start, int end)
{
	assert (!(iow->display.io_width==0 || iow->display.io_height==0));
	iow->display.io_draw_range(iow, start, end);
}

//*************************************************

// get a string from stdin and encodes it in the current locale's codepage
char *io_gets(struct IoConsole* io, char *buffer )
{
	short i=0;
	unsigned char chrbuf[5];

	io_putc(io, 0xE);		/* io->header.cursor on */

	while (TRUE)
	{
		io_getc_l(io, (char*)chrbuf, twr_get_current_locale());
		if (*chrbuf==0x1b)		// ESC key
			return NULL;

		if (!(*chrbuf==0x08 && i == 0))
			for (int k=0; chrbuf[k]; k++)
				io_putc(io, chrbuf[k]);

		if (*chrbuf=='\n' || *chrbuf=='\r')
		{
			buffer[i]=0;
			io_putc(io, 0xF);		/* io->header.cursor off */
			return buffer;
		}
		else if (*chrbuf==0x08 && i > 0)  /* backspace */
		{
			i--;
			while (i>0 && (buffer[i]&0xC0)==0x80) {  // utf extended bytes all start with 10 binary) { 
				i--;
			}
		}
		else if (*chrbuf>=0x20)
		{
			for (int k=0; chrbuf[k]; k++)
				buffer[i++] = chrbuf[k];
		}
	}
}

//*************************************************
// same as fprintf
void io_printf(struct IoConsole *io, const char *format, ...) {
	va_list vlist;
	va_start(vlist, format);

	twr_vcbprintf((twr_vcbprintf_callback)io_putc, io, format, vlist);

	va_end(vlist);
}

//*************************************************

