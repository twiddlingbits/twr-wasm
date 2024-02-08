#include "twr-wasm.h"
#include <stddef.h>

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

static void draw_trs80_graphic(struct IoConsoleWindow* iow, unsigned short offset, unsigned char val)
{
	int x, y;

	x = (offset%64)*iow->display.my_cx;
	y = (offset/64)*iow->display.my_cy;

	twrCanvasFillRect(x, y, iow->display.my_cx, iow->display.my_cy, twrCanvasGetColorBlack());

	if (val == 32)
		return;

	if (val&1)
		twrCanvasFillRect(x, y, iow->display.my_cell_w1, iow->display.my_cell_h1, iow->display.my_color);

	y=y+iow->display.my_cell_h1;

	if (val&4)
		twrCanvasFillRect(x, y, iow->display.my_cell_w1, iow->display.my_cell_h2, iow->display.my_color);

	y=y+iow->display.my_cell_h2;

	if (val&16)
		twrCanvasFillRect(x, y, iow->display.my_cell_w1, iow->display.my_cell_h3, iow->display.my_color);

	x=x+iow->display.my_cell_w1;

	if (val&32)
		twrCanvasFillRect(x, y, iow->display.my_cell_w2, iow->display.my_cell_h3, iow->display.my_color);

	y=y-iow->display.my_cell_h2;

	if (val&8)
		twrCanvasFillRect(x, y, iow->display.my_cell_w2, iow->display.my_cell_h2, iow->display.my_color);

	y=y-iow->display.my_cell_h1;

	if (val&2)
		twrCanvasFillRect(x, y, iow->display.my_cell_w2, iow->display.my_cell_h1, iow->display.my_color);

} 

//**************************************************

static void draw_trs80_char(struct IoConsoleWindow* iow, unsigned short offset, unsigned char value)
{
	if (value&128 || value==32)
	{
		draw_trs80_graphic(iow, offset, value);
	}
	else
	{
		int x, y;

		x = (offset%64)*iow->display.my_cx;
		y = (offset/64)*iow->display.my_cy;

		if (!iow->display.lower_case_mod_installed)
		{
			if ((value & 32) == 0)	// When No lowercase mod installed
				value |= 64;		// BIT6 = NOT (BIT5 OR BIT7)
			else // this part not needed -- why?
				value &= (~64);		// BIT6 = NOT (BIT5 OR BIT7)
		}
		twrCanvasCharOut(x, y, value);
	}
}


//*************************************************

//!!!!!! CHANGE THIS AND WINDOWS VERSION TO USE A (to be created) CANVAS DRIVER
//!!!! move this to io.c

static void drawRange(struct IoConsoleWindow* iow, unsigned char* vm, int start, int end)
{
	//twrCanvasBegin();   i dont think i need this (at lest yet)

	for (int i=start; i <= end; i++)
		draw_trs80_char(iow, i, vm[i]);

	//twrCanvasEnd();
}

//*************************************************


// need to implement these in header?
//	void (*io_close)  (struct IoConsole*);
//	int  (*io_chk_brk)(struct IoConsole*);

struct IoConsole* twr_wasm_get_windowcon()
{
	static struct IoConsoleWindow iow;
	static unsigned char video_mem[1024];

	for (short i=0; i < 1024; i++)
		video_mem[i]=' ';

	iow.con.charin.io_inkey		= inkey;
	iow.con.charout.io_putc		= NULL;			// Use default implementation
	iow.con.charin.io_getc		= getc;
	iow.con.header.io_chk_brk	= NULL;   // need to sort this out:  checkForBreak;
	iow.con.header.io_close		= NULL;			// don't call any close
	iow.con.header.type			= IO_TYPE_WINDOW;

	iow.display.io_draw_range= drawRange;
	iow.display.io_peek_keyboard=NULL;

	iow.display.io_width = 64;
	iow.display.io_height = 16;
	
	iow.display.cursor_visible = FALSE;
	iow.con.header.cursor=0;
	iow.display.video_mem = video_mem;


	iow.display.my_cx = twrCanvasGetAvgCharWidth();
	iow.display.my_cy = twrCanvasGetCharHeight();

	// Calc each cell seperately to avoid rounding errors
	iow.display.my_cell_w1 = iow.display.my_cx / 2;  
	iow.display.my_cell_w2 = iow.display.my_cx - iow.display.my_cell_w1;  
	iow.display.my_cell_h1 = iow.display.my_cy / 3;
	iow.display.my_cell_h2 = iow.display.my_cy / 3;
	iow.display.my_cell_h3 = iow.display.my_cy - iow.display.my_cell_h1 - iow.display.my_cell_h2;

	iow.display.lower_case_mod_installed=1;

	iow.display.my_color=twrCanvasGetColorWhite();

	io_draw_range(&iow, 0, 1023);

	return &iow.con;
}



