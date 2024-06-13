#include <stddef.h>
#include <assert.h>
#include <stdlib.h>
#include "twr-io.h"
#include "twr-draw2d.h"
#include "twr-jsimports.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


static int wingetc(struct IoConsole* io)
{
	UNUSED(io);
	return twrCanvasCharIn();
}

static char wininkey(struct IoConsole* io)
{
	UNUSED(io);
	return twrCanvasInkey();
}

//**************************************************

static void draw_trs80_graphic(struct IoConsoleWindow* iow, struct d2d_draw_seq* ds, int offset, cellsize_t val, unsigned long fgc, unsigned long bgc)
{
	int x, y;

	x = (offset%iow->display.width)*iow->display.my_cx;
	y = (offset/iow->display.width)*iow->display.my_cy;

	d2d_setfillstylergba(ds, bgc);
	d2d_fillrect(ds, x, y, iow->display.my_cx, iow->display.my_cy);

	if (val == 32)
		return;

	d2d_setfillstylergba(ds, fgc);

	if (val&1)
		d2d_fillrect(ds, x, y, iow->display.my_cell_w1, iow->display.my_cell_h1);

	y=y+iow->display.my_cell_h1;

	if (val&4)
		d2d_fillrect(ds, x, y, iow->display.my_cell_w1, iow->display.my_cell_h2);

	y=y+iow->display.my_cell_h2;

	if (val&16)
		d2d_fillrect(ds, x, y, iow->display.my_cell_w1, iow->display.my_cell_h3);

	x=x+iow->display.my_cell_w1;

	if (val&32)
		d2d_fillrect(ds, x, y, iow->display.my_cell_w2, iow->display.my_cell_h3);

	y=y-iow->display.my_cell_h2;

	if (val&8)
		d2d_fillrect(ds, x, y, iow->display.my_cell_w2, iow->display.my_cell_h2);

	y=y-iow->display.my_cell_h1;

	if (val&2)
		d2d_fillrect(ds, x, y, iow->display.my_cell_w2, iow->display.my_cell_h1);

} 

//**************************************************

static void draw_cell(struct IoConsoleWindow* iow, struct d2d_draw_seq* ds, int offset, cellsize_t value, unsigned long fgc, unsigned long bgc)
{
	if ( (value&TRS80_GRAPHIC_MARKER_MASK)==TRS80_GRAPHIC_MARKER || value==32)
	{
		draw_trs80_graphic(iow, ds, offset, value&TRS80_GRAPHIC_CHAR_MASK, fgc, bgc);
	}
	else
	{
		int x, y;

		x = (offset%iow->display.width)*iow->display.my_cx;
		y = (offset/iow->display.width)*iow->display.my_cy;

		d2d_setfillstylergba(ds, bgc);
		d2d_fillrect(ds, x, y, iow->display.my_cx, iow->display.my_cy);
		if (value!=32) {
			d2d_setfillstylergba(ds, fgc);
			d2d_fillcodepoint(ds, value, x, y);
		}
	}
}

//*************************************************

//!!!!!! CHANGE THIS AND WINDOWS VERSION TO USE A (to be created) CANVAS DRIVER
//!!!! move this to io.c

static void beginDrawRange(struct IoConsoleWindow* iow) {

	if (iow->display.nest_level==0)
		iow->display.ds=d2d_start_draw_sequence(500);

	iow->display.nest_level++;
}

static void endDrawRange(struct IoConsoleWindow* iow) {
	iow->display.nest_level--;
	assert(iow->display.nest_level>=0);
	if (iow->display.nest_level==0) 
		d2d_end_draw_sequence(iow->display.ds);
}

static void drawRange(struct IoConsoleWindow* iow, int start, int end)
{
	beginDrawRange(iow);

	for (int i=start; i <= end; i++) {
		draw_cell(iow, iow->display.ds, i, iow->display.video_mem[i], iow->display.fore_color_mem[i], iow->display.back_color_mem[i] );
	}

	endDrawRange(iow);
}

//*************************************************


// need to implement these in header?
//	void (*io_close)  (struct IoConsole*);
//	int  (*io_chk_brk)(struct IoConsole*);

struct IoConsole* twr_windowcon()
{
	static struct IoConsoleWindow iow;

	const int width=d2d_get_canvas_prop("widthInChars");
	const int height=d2d_get_canvas_prop("heightInChars");
	const int size=width*height;

	assert(width>0);
	assert(height>0);
	assert(iow.con.header.type==0);  // twr_windowcon() function can only be called once

	iow.display.video_mem=malloc(size*sizeof(cellsize_t));
	iow.display.fore_color_mem=malloc(size*sizeof(unsigned long));
	iow.display.back_color_mem=malloc(size*sizeof(unsigned long));

	iow.con.charin.io_inkey		= wininkey;
	iow.con.charout.io_putc		= NULL;			// Use default implementation
	iow.con.charin.io_getc32		= wingetc;
	iow.con.header.io_chk_brk	= NULL;   		// need to sort this out:  checkForBreak;
	iow.con.header.io_close		= NULL;			// don't call any close
	iow.con.header.type			= IO_TYPE_WINDOW;

	iow.display.io_draw_range=drawRange;
	iow.display.io_begin_draw=beginDrawRange;
	iow.display.io_end_draw=endDrawRange;
	
	iow.display.nest_level=0;  

	iow.display.width = width;
	iow.display.height = height;
	iow.display.size=size;
	
	iow.display.cursor_visible = false;
	iow.con.header.cursor=0;

	iow.display.my_cx = d2d_get_canvas_prop("charWidth");
	iow.display.my_cy = d2d_get_canvas_prop("charHeight");
	assert(iow.display.my_cx>0);
	assert(iow.display.my_cy>0);

	// Calc each cell separately to avoid rounding errors
	iow.display.my_cell_w1 = iow.display.my_cx / 2;  
	iow.display.my_cell_w2 = iow.display.my_cx - iow.display.my_cell_w1;  
	iow.display.my_cell_h1 = iow.display.my_cy / 3;
	iow.display.my_cell_h2 = iow.display.my_cy / 3;
	iow.display.my_cell_h3 = iow.display.my_cy - iow.display.my_cell_h1 - iow.display.my_cell_h2;

	iow.display.fore_color=RGB_TO_RGBA(d2d_get_canvas_prop("foreColor"));
	iow.display.back_color=RGB_TO_RGBA(d2d_get_canvas_prop("backColor"));

	io_cls(&iow);

	return &iow.con;
}



