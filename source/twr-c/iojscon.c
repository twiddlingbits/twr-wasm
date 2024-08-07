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
static void jsconputc(twr_ioconsole_t* io, unsigned char c)
{
	const int cp=__get_current_lc_ctype_code_page_modified();

	twrConCharOut(((struct IoJSCon*)io)->jsid, c, cp);
}

static void jsconputstr(twr_ioconsole_t* io, const char * str)
{
	const int cp=__get_current_lc_ctype_code_page_modified();

	twrConPutStr(((struct IoJSCon*)io)->jsid, str, cp);
}


static int getc32(twr_ioconsole_t* io)
{
	return twrConCharIn(((struct IoJSCon*)io)->jsid);
}

static void setfocus(twr_ioconsole_t* io)
{
	twrSetFocus(((struct IoJSCon*)io)->jsid);
}

static void jsconclose(twr_ioconsole_t* io)
{
	free(io);
}

static int get_prop(twr_ioconsole_t* io, const char* prop_name)
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

static twr_ioconsole_t* jscon_impl(int jsid, struct IoJSCon *jscon, void close_ptr(twr_ioconsole_t * io))
{
	jscon->jsid=jsid;
	int type = get_prop((twr_ioconsole_t *)jscon, "type");
	jscon->io.con.header.type=type;
	jscon->io.con.header.io_close=close_ptr;
	jscon->io.con.header.io_get_prop=get_prop;

	if (type&IO_TYPE_CHARWRITE) {
		jscon->io.con.charout.io_putc=jsconputc;
		jscon->io.con.charout.io_putstr=jsconputstr;
	}

	if (type&IO_TYPE_CHARREAD) {
		jscon->io.con.charin.io_getc32=getc32;
		jscon->io.con.charin.io_setfocus=setfocus;
	}

	if (type&IO_TYPE_ADDRESSABLE_DISPLAY) {
		struct IoDisplay * display=&jscon->io.display;
		display->width=get_prop((twr_ioconsole_t *)jscon, "widthInChars");
		display->height=get_prop((twr_ioconsole_t *)jscon, "heightInChars");

		display->io_cls=cls;
		display->io_setc32=setc32;
		display->io_setreset=setreset;
		display->io_point=point;
		display->io_set_cursor=set_cursor;
		display->io_set_colors=set_colors;
		display->io_set_range=set_range;
	}

	return (twr_ioconsole_t*)jscon;
}

twr_ioconsole_t* twr_jscon(int jsid)
{
   // -1 is what an undefined console maps to in jsid land
   if (jsid<0) return NULL; 

	struct IoJSCon *jscon=calloc(1, sizeof(struct IoJSCon));
	return jscon_impl(jsid, jscon, jsconclose);
}

twr_ioconsole_t* twr_jscon_singleton(int jsid)
{
	static struct IoJSCon the_con;

   if (jsid<0) return NULL; 

	return jscon_impl(jsid, &the_con, NULL);
}

twr_ioconsole_t* twr_get_console(const char* name)
{
	const int id=twrGetConIDFromName(name);

	if (id<0) return NULL;

	return twr_jscon(id);
}

int __twr_get_jsid(twr_ioconsole_t* io) {
   return ((struct IoJSCon*)io)->jsid;
}





