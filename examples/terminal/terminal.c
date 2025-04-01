#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <locale.h>
#include "twr-crt.h"

/* this twr-wasm C example draws a utf-8 string in the middle of a terminal console, */
/* and allows the user to move the string up or down with the u, d or arrow keys */

void draw_outline(twr_ioconsole_t* io);
void show_str_centered(twr_ioconsole_t* io, int y, const char* str, unsigned long forecolor, unsigned long backcolor);

void show_terminal() {
   twr_ioconsole_t* io=twr_get_stdio_con();

   assert(io->header.type&IO_TYPE_ADDRESSABLE_DISPLAY);

   setlocale(LC_ALL, "");  // set user default locale, which is always UTF-8.  This is here to turn on UTF-8.

   int h;
   const char* str=" Hello World (press u, d, ↑, or ↓) ";  // arrows are UTF-8 multibyte
   const char* spc="                                   ";
   char inbuf[6];  // UTF-8 should be max 4 bytes plus string ending 0
   unsigned long forecolor, backcolor;

   h=io_get_height(io)/2;
   io_get_colors(io, &forecolor, &backcolor);

   draw_outline(io);

    while (1) {
      show_str_centered(io, h,  str, forecolor, 0xFFFFFF);  // white
      io_mbgetc(stdin, inbuf); // also see twr_getc32 documentation
      show_str_centered(io, h,  spc, forecolor, backcolor);   // erase old string

      if (strcmp(inbuf,"u")==0 || strcmp(inbuf,"↑")==0) {   // arrows are multibyte UTF-8.
         h=h-1;
         if (h<1) h=1;  // border I drew is in the 0 position
      }
      if (strcmp(inbuf,"d")==0 || strcmp(inbuf,"↓")==0) {
         h=h+1;
         if (h>=(io_get_height(io)-1)) h=io_get_height(io)-2;  // border I drew is in the height-1 position
      }
   }
}

void show_str_centered(twr_ioconsole_t* io, int y, const char* str, unsigned long forecolor, unsigned long backcolor) {
   int len=twr_mbslen_l(str, twr_get_current_locale());
   int x=(io_get_width(io)-len)/2;
   io_set_cursorxy(io, x, y);
   io_set_colors(io, forecolor, backcolor);  // light green
   io_putstr(io, str);

}

void draw_outline(twr_ioconsole_t* io) {
   const int w=io_get_width(io)*2;   // graphic cells are 2x3
   const int h=io_get_height(io)*3;
   unsigned long fgcolor, bgcolor;

   io_begin_draw(io);

   io_get_colors(io, &fgcolor, &bgcolor);
   io_set_colors(io, 0x000000, bgcolor);  // draw in black

   for (int i=0; i<w; i++) {
      io_setreset(io, i, 0, true);
      io_setreset(io, i, h-1, true);
   }

   for (int i=0; i<h; i++) {
      io_setreset(io, 0, i, true);
      io_setreset(io, w-1, i, true);
   }

   io_set_colors(io, fgcolor, bgcolor);  // restore

   io_end_draw(io);

}
