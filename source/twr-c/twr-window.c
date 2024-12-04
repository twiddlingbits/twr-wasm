#include "twr-window.h"
#include "twr-crt.h"

twr_ioconsole_t* twr_window_get_app_canvas(twr_ioconsole_t* con) {
   int id = twrGetAppCanvasJSID(__twr_get_jsid(con));
   return twr_jscon(id);
}

struct twr_window_menu twr_window_add_menu(twr_ioconsole_t * con, const char* text) {
   int id = __twr_get_jsid(con);
   
   return (struct twr_window_menu){
      .jsid = id,
      .menu_id = twrWindowAddMenu(id, text)
   };
}