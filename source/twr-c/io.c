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
 * The Windowed functions (eg. setreset) only work on windowed consoles.
 * 
 * For stream (TTY) devices,
 * 	IoConsoleHeader.type == 0 (see twr-io.h)
 *
 * struct IoConsole contains pointers to device dependent driver functions, as well
 * as variables used by this code.
 *
 * For Example:
 *    struct IoConsole* io = twr_jscon(0);
 *    io_putstr(io, "hello world\n");
 *
 */


//*************************************************

// io_putc outputs a byte of a stream encoded in the current codepage.
// could be part of a multibyte stream (eg. UTF-8)

void io_putc(struct IoConsole* io, unsigned char c)
{
	assert(io->charout.io_putc);
	(*io->charout.io_putc)(io, c);
}

//*************************************************

void io_putstr(struct IoConsole* io, const char* str)
{
	if (io->charout.io_putstr) {
		(*io->charout.io_putstr)(io, str);
	}
	else {
		for (int i=0; str[i]; i++)
			io_putc(io, str[i]);
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

void io_setfocus(struct IoConsole* io)
{
	if (io->charin.io_setfocus)
		(*io->charin.io_setfocus)(io);
}

//*************************************************

// returns a unicode 32 bit code point
// console must support IO_TYPE_CHARREAD
int io_getc32(struct IoConsole* io)
{
	if (*io->charin.io_getc32)
		return (*io->charin.io_getc32)(io);
	else
		return 0;
}

// returns a single multibyte character as a null terminated string from a console that supports IO_TYPE_CHARREAD using current code page (locale)
void io_mbgetc(struct IoConsole* io, char* strout)
{
	const int code_point = io_getc32(io);
	int code_page = __get_current_lc_ctype_code_page(); //"C" locale is ASCII

	const int len=twrUnicodeCodePointToCodePage(strout, code_point, code_page);
	strout[len]=0;
}

// returns multibyte null terminated string from a console that supports IO_TYPE_CHARREAD using current code page (locale)
// collects multibyte characters until return is entered
char *io_mbgets(struct IoConsole* io, char *buffer)
{
	int i=0;
	unsigned char chrbuf[5];

	io_putc(io, 0xE);		/* io->header.cursor on */

	while (true)
	{
		io_mbgetc(io, (char*)chrbuf);

		if (*chrbuf==0x1b)		// ESC key
			return NULL;

		if (!(*chrbuf==0x08 && i == 0)) {
			for (int k=0; chrbuf[k]; k++) {
				io_putc(io, chrbuf[k]);
			}
		}

		if (*chrbuf=='\n' || *chrbuf=='\r')
		{
			buffer[i]=0;
			io_putc(io, 0xF);		/* io->header.cursor off */
			return buffer;
		}
		else if (*chrbuf==0x08 && i > 0)  /* backspace */
		{
			i--;
			if (__is_utf8_locale(__get_lconv_lc_ctype(twr_get_current_locale()))) {
				while (i>0 && (buffer[i]&0xC0)==0x80) {  // utf8 extended bytes all start with 10 binary) { 
					i--;
				}
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

int io_get_prop(struct IoConsole* io, const char* key)
{
	if (io->header.io_get_prop)
		return io->header.io_get_prop(io, key);
	else
		return -1;
}

//*************************************************
void io_cls(struct IoConsoleWindow* iow)
{
	if (iow->display.io_cls)
		iow->display.io_cls(iow);
}

/* accepts a byte stream encoded in the passed code_page. EG, UTF-8 */
/* enable UTF-8 with "C" locale, as does printf, putc (see iodiv.c driver) */
/* returns true if a character is set, returns false if partial multibyte sequence was processed */
bool io_setc(struct IoConsoleWindow* iow, int location, unsigned char c)
{
	const int cp=__get_current_lc_ctype_code_page_modified();
	int r;
	if (c<=127) r=c;  // speed optimization
	else r=twrCodePageToUnicodeCodePoint(c, cp);
	if (r>0) {
		io_setc32(iow, location, r);
		return true;
	}
	else {
		return false;
	}
}

//*************************************************
/* c is a unicode 32 codepoint */
void io_setc32(struct IoConsoleWindow* iow, int location, int c32) {
	if (iow->display.io_setc32)
		iow->display.io_setc32(iow, location, c32);
}

//*************************************************

void io_setreset(struct IoConsoleWindow* iow, int x, int y, bool isset) {
	if (iow->display.io_setreset)
		iow->display.io_setreset(iow, x, y, isset);
}

//*************************************************

bool io_point(struct IoConsoleWindow* iow, int x, int y)
{
	if (iow->display.io_point)
		return iow->display.io_point(iow, x, y);
	else
		return false;
}


//*************************************************

void io_set_cursor(struct IoConsoleWindow* iow, int position)
{
	if (iow->display.io_set_cursor)
		iow->display.io_set_cursor(iow, position);
}

//*************************************************

void io_set_cursorxy(struct IoConsoleWindow* iow, int x, int y) {
   iow->display.io_set_cursor(iow, iow->display.width*y+x); 
}

//*************************************************

int io_get_cursor(struct IoConsole* io)
{
	return io->header.io_get_prop(io, "cursorPos");
}

int io_get_width(struct IoConsoleWindow* iow) {
	return iow->con.header.io_get_prop((struct IoConsole*)iow, "widthInChars");

}

int io_get_height(struct IoConsoleWindow* iow) {
	return iow->con.header.io_get_prop((struct IoConsole*)iow, "heightInChars");
}

//*************************************************

// colors are 24 bit RGB
void io_set_colors(struct IoConsole* io, unsigned long foreground, unsigned long background) {
	assert(io->header.type&IO_TYPE_ADDRESSABLE_DISPLAY);  // currently only works on WindowConsole

	struct IoConsoleWindow* iow=(struct IoConsoleWindow*)io;

   iow->display.io_set_colors(iow, foreground, background); 
}

//*************************************************

void io_get_colors(struct IoConsole* io, unsigned long *foreground, unsigned long *background) {
	assert(io->header.type&IO_TYPE_ADDRESSABLE_DISPLAY);  // currently only works on WindowConsole

	struct IoConsoleWindow* iow=(struct IoConsoleWindow*)io;

	*foreground=iow->con.header.io_get_prop((struct IoConsole*)iow, "foreColorAsRGB");
	*background=iow->con.header.io_get_prop((struct IoConsole*)iow, "backColorAsRGB");
}

//*************************************************

void io_set_range(struct IoConsoleWindow* iow, int *chars32, int start, int len)
{
	iow->display.io_set_range(iow, chars32, start, len);
}

//*************************************************
// same as fprintf
void io_printf(struct IoConsole *io, const char *format, ...) {

	va_list vlist;
	va_start(vlist, format);

	io_begin_draw(io);
	twr_vcbprintf((twr_vcbprintf_callback)io_putc, io, format, vlist);
	io_end_draw(io);

	va_end(vlist);

}

//*************************************************

// currently unimplemented

void io_begin_draw(struct IoConsole* io) {

}

void io_end_draw(struct IoConsole* io) {
	
}