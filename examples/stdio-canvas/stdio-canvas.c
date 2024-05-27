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

    if (!(iow->con.header.type&IO_TYPE_WINDOW)) {  // could also use assert here
        twr_conlog("error - expected window console");
        return;
    }

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
			if (h<0) h=0;
		}
		if (strcmp(inbuf,"d")==0 || strcmp(inbuf,"↓")==0) {
			h=h+1;
			if (h>=iow->display.io_height) h=iow->display.io_height-1;
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

	for (int i=0; i<w; i++) {
		io_setreset(iow, i, 0, true);
		io_setreset(iow, i, h-1, true);
	}
}
