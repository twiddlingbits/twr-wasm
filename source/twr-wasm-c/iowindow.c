#include <stddef.h>
#include <assert.h>
#include <stdlib.h>
#include "twr-wasm.h"

#ifndef UNUSED
#define UNUSED(x) (void)(x)
#endif


static int getc(struct IoConsole* io)
{
	UNUSED(io);
	return twrCanvasCharIn();
}

static char inkey(struct IoConsole* io)
{
	UNUSED(io);
	return twrCanvasInkey();
}

//**************************************************

static void draw_trs80_graphic(struct IoConsoleWindow* iow, struct d2d_draw_seq* ds, unsigned short offset, unsigned char val)
{
	int x, y;

	x = (offset%iow->display.io_width)*iow->display.my_cx;
	y = (offset/iow->display.io_width)*iow->display.my_cy;

	d2d_setfillstyle(ds, iow->display.back_color);
	d2d_fillrect(ds, x, y, iow->display.my_cx, iow->display.my_cy);

	if (val == 32)
		return;

	d2d_setfillstyle(ds, iow->display.fore_color);

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

static void draw_trs80_char(struct IoConsoleWindow* iow, struct d2d_draw_seq* ds, unsigned short offset, unsigned char value)
{
	if (value&128 || value==32)
	{
		draw_trs80_graphic(iow, ds, offset, value);
	}
	else
	{
		int x, y;

		x = (offset%iow->display.io_width)*iow->display.my_cx;
		y = (offset/iow->display.io_width)*iow->display.my_cy;

		if (!iow->display.lower_case_mod_installed)
		{
			if ((value & 32) == 0)	// When No lowercase mod installed
				value |= 64;		// BIT6 = NOT (BIT5 OR BIT7)
			else // this part not needed -- why?
				value &= (~64);		// BIT6 = NOT (BIT5 OR BIT7)
		}
		d2d_setfillstyle(ds, iow->display.back_color);
		d2d_fillrect(ds, x, y, iow->display.my_cx, iow->display.my_cy);
		if (value!=32) {
			d2d_setfillstyle(ds, iow->display.fore_color);
			d2d_fillchar(ds, value, x, y);
		}
	}
}


//*************************************************

//!!!!!! CHANGE THIS AND WINDOWS VERSION TO USE A (to be created) CANVAS DRIVER
//!!!! move this to io.c

static void drawRange(struct IoConsoleWindow* iow, unsigned char* vm, int start, int end)
{
	struct d2d_draw_seq* ds=d2d_start_draw_sequence(500);

	for (int i=start; i <= end; i++)
		draw_trs80_char(iow, ds, i, vm[i]);

	d2d_end_draw_sequence(ds);
}

//*************************************************


// need to implement these in header?
//	void (*io_close)  (struct IoConsole*);
//	int  (*io_chk_brk)(struct IoConsole*);

struct IoConsole* twr_wasm_get_windowcon()
{
	static struct IoConsoleWindow iow;
	static unsigned char *video_mem;

	int width=d2d_get_canvas_prop("widthInChars");
	int height=d2d_get_canvas_prop("heightInChars");

	assert(width>0);
	assert(height>0);

	assert(video_mem==0);
	video_mem=malloc(width*height);

	for (int i=0; i < width*height; i++)
		video_mem[i]=' ';

	iow.con.charin.io_inkey		= inkey;
	iow.con.charout.io_putc		= NULL;			// Use default implementation
	iow.con.charin.io_getc		= getc;
	iow.con.header.io_chk_brk	= NULL;   		// need to sort this out:  checkForBreak;
	iow.con.header.io_close		= NULL;			// don't call any close
	iow.con.header.type			= IO_TYPE_WINDOW;

	iow.display.io_draw_range= drawRange;
	iow.display.io_peek_keyboard=NULL;

	iow.display.io_width = width;
	iow.display.io_height = height;
	
	iow.display.cursor_visible = FALSE;
	iow.con.header.cursor=0;
	iow.display.video_mem = video_mem;


	iow.display.my_cx = twrCanvasGetProp("charWidth");
	iow.display.my_cy = twrCanvasGetProp("charHeight");
	assert(iow.display.my_cx>0);
	assert(iow.display.my_cy>0);

	// Calc each cell separately to avoid rounding errors
	iow.display.my_cell_w1 = iow.display.my_cx / 2;  
	iow.display.my_cell_w2 = iow.display.my_cx - iow.display.my_cell_w1;  
	iow.display.my_cell_h1 = iow.display.my_cy / 3;
	iow.display.my_cell_h2 = iow.display.my_cy / 3;
	iow.display.my_cell_h3 = iow.display.my_cy - iow.display.my_cell_h1 - iow.display.my_cell_h2;

	iow.display.lower_case_mod_installed=1;

	iow.display.fore_color=RGB_TO_RGBA(twrCanvasGetProp("foreColor"));
	iow.display.back_color=RGB_TO_RGBA(twrCanvasGetProp("backColor"));

	io_draw_range(&iow, 0,  width*height-1);

	return &iow.con;
}



