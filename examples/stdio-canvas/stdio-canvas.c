#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <locale.h>
#include "twr-crt.h"

/* this tiny-wasm-runtime C example draws a utf-8 string in the middle of a windowed console, */
/* and allows the user to move the string up or down with the u, d or arrow keys  */

/* see include/twr-io.h for available functions to draw chars to windowed console */

void draw_outline(struct IoConsoleWindow* iow);
void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str);

void stdio_canvas() {
    struct IoConsoleWindow* iow=(struct IoConsoleWindow*)twr_get_stdio_con();

    assert(iow->con.header.type&IO_TYPE_WINDOW);

	 setlocale(LC_ALL, "");  // set user default locale, which is always UTF-8.  This is here to turn on UTF-8.

    int h;
    const char* str="Hello World (press u, d, ↑, or ↓)";  // arrows are UTF-8 multibyte
    const char* spc="                                 ";
	 char inbuf[6];  // UTF-8 should be max 4 bytes plus string ending 0

    h=iow->display.io_height/2;

	draw_outline(iow);

    while (1) {
		show_str_centered(iow, h,  str);
		io_getc_l(stdin, inbuf, twr_get_current_locale());
		// an alternative to io_get_l(), it to use getchar(), io_getc(), getc(stdin), or fgetc(stdin), which all return int unicode codepoints
		show_str_centered(iow, h,  spc);   // erase old string

		if (strcmp(inbuf,"u")==0 || strcmp(inbuf,"↑")==0) {   // arrows are multibyte UTF-8.
			h=h-1;
			if (h<1) h=1;  // border I drew is in the 0 position
		}
		if (strcmp(inbuf,"d")==0 || strcmp(inbuf,"↓")==0) {
			h=h+1;
			if (h>=(iow->display.io_height-1)) h=iow->display.io_height-2;  // border I drew is in the io_height-1 position
		}
	}
}

void show_str_centered(struct IoConsoleWindow* iow, int h, const char* str) {
    int len=twr_mbslen_l(str, twr_get_current_locale());
    int x=(iow->display.io_width-len)/2;
    io_set_cursorxy(iow, x, h);
    io_putstr(&iow->con, str);
}

void draw_outline(struct IoConsoleWindow* iow) {
	const int w=iow->display.io_width*2;   // graphic cells are 2x3
	const int h=iow->display.io_height*3;

	unsigned long fgcolor, bgcolor;
	io_get_colors(&iow->con, &fgcolor, &bgcolor);
	io_set_colors(&iow->con, 0x000000, bgcolor);  // draw in black

	for (int i=0; i<w; i++) {
		io_setreset(iow, i, 0, true);
		io_setreset(iow, i, h-1, true);
	}

	for (int i=0; i<h; i++) {
		io_setreset(iow, 0, i, true);
		io_setreset(iow, w-1, i, true);
	}

	io_set_colors(iow, fgcolor, bgcolor);  // restore

}
