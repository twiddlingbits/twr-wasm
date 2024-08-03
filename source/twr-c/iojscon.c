#include <stdlib.h>
#include "twr-io.h"
#include "twr-jsimports.h"


struct IoJSCon {
	struct IoConsoleWindow io;
	int jsid;
};

// a jscon is primarily implemented in JavaScript
// it can be a streaming console with an endpoint of a <div> or the browser debug console
// it can be a terminal console implemented with a <canvas> tag

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// All console's implement the basic streaming functions putc, getc
// and close
static void jsconputc(struct IoConsole* io, unsigned char c)
{
	const int cp=__get_current_lc_ctype_code_page_modified();

	twrConCharOut(((struct IoJSCon*)io)->jsid, c, cp);
}

static void jsconputstr(struct IoConsole* io, const char * str)
{
	const int cp=__get_current_lc_ctype_code_page_modified();

	twrConPutStr(((struct IoJSCon*)io)->jsid, str, cp);
}


static int getc32(struct IoConsole* io)
{
	return twrConCharIn(((struct IoJSCon*)io)->jsid);
}

static void jsconclose(struct IoConsole* io)
{
	free(io);
}

static int get_prop(struct IoConsole* io, const char* prop_name)
{
	return twrConGetProp(((struct IoJSCon*)io)->jsid, prop_name);
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

// Display functions

static void cls(struct IoConsoleWindow* iow) {
	twrConCls(((struct IoJSCon*)iow)->jsid);
}

static void setc32(struct IoConsoleWindow*  iow, int location, int c32) {
	twrConSetC32(((struct IoJSCon*)iow)->jsid, location, c32);
}

static void setreset(struct IoConsoleWindow* iow, int x, int y, bool isset) {
	twrConSetReset(((struct IoJSCon*)iow)->jsid, x, y, isset);
}

static bool point(struct IoConsoleWindow* iow, int x, int y) {
	return twrConPoint(((struct IoJSCon*)iow)->jsid, x, y);
}

static void set_cursor(struct IoConsoleWindow* iow, int position) {
	twrConSetCursor(((struct IoJSCon*)iow)->jsid, position);
}

static void set_colors(struct IoConsoleWindow* iow, unsigned long foreground, unsigned long background) {
	twrConSetColors(((struct IoJSCon*)iow)->jsid, foreground, background);
}

static void set_range(struct IoConsoleWindow* iow, int * chars, int start, int len) {
	twrConSetRange(((struct IoJSCon*)iow)->jsid, chars, start, len);
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

static struct IoConsole* jscon_impl(int jsid, struct IoJSCon *jscon, void close_ptr(struct IoConsole * io))
{
	jscon->jsid=jsid;
	int type = get_prop((struct IoConsole *)jscon, "type");
	jscon->io.con.header.type=type;
	jscon->io.con.header.io_close=close_ptr;
	jscon->io.con.header.io_get_prop=get_prop;

	if (type&IO_TYPE_CHARWRITE) {
		jscon->io.con.charout.io_putc=jsconputc;
		jscon->io.con.charout.io_putstr=jsconputstr;
	}

	if (type&IO_TYPE_CHARREAD) {
		jscon->io.con.charin.io_getc32=getc32;
	}

	if (type&IO_TYPE_ADDRESSABLE_DISPLAY) {
		struct IoDisplay * display=&jscon->io.display;
		display->width=get_prop((struct IoConsole *)jscon, "widthInChars");
		display->height=get_prop((struct IoConsole *)jscon, "heightInChars");

		display->io_cls=cls;
		display->io_setc32=setc32;
		display->io_setreset=setreset;
		display->io_point=point;
		display->io_set_cursor=set_cursor;
		display->io_set_colors=set_colors;
		display->io_set_range=set_range;
	}

	return (struct IoConsole*)jscon;
}

struct IoConsole* twr_jscon(int jsid)
{
	struct IoJSCon *jscon=calloc(1, sizeof(struct IoJSCon));
	return jscon_impl(jsid, jscon, jsconclose);
}

struct IoConsole* twr_jscon_singleton(int jsid)
{
	static struct IoJSCon the_con;

	return jscon_impl(jsid, &the_con, NULL);
}



