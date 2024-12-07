#ifndef __TWR_WINDOW_H__
#define __TWR_WINDOW_H__

#ifdef __cplusplus
extern "C" {
#endif

#include "twr-io.h"

__attribute__((import_name("twrGetAppCanvasJSID"))) int twrGetAppCanvasJSID(int jsid);

twr_ioconsole_t* twr_window_get_app_canvas(twr_ioconsole_t * con);

__attribute__((import_name("twrWindowAddMenu"))) int twrWindowAddMenu(int jsid, const char* text);

struct twr_window_menu {
   int jsid;
   int menu_id;
};


struct twr_window_menu twr_window_add_menu(twr_ioconsole_t * con, const char* text);

#ifdef __cplusplus
}
#endif

#endif