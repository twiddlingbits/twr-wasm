#include "twr-window.h"
#include "twr-crt.h"

twr_ioconsole_t* twr_window_get_app_canvas(twr_ioconsole_t* con) {
   int id = twrGetAppCanvasJSID(__twr_get_jsid(con));
   return twr_jscon(id);
}

struct twr_window_menu twr_window_add_menu(twr_ioconsole_t * con, const char* text) {
   int id = __twr_get_jsid(con);
   int menu_id = twrWindowAddMenu(id, text);
   return (struct twr_window_menu){
      .jsid = id,
      .menu_id = menu_id,
   };
}

struct twr_window_widget twr_window_menu_add_widget(const struct twr_window_menu* menu, const struct twr_widget_constructor* widget) {
   int widget_id = twrWindowMenuAddWidget(menu->jsid, menu->menu_id, widget);
   return (struct twr_window_widget){
      .jsid = menu->jsid,
      .widget_id = widget_id
   };
}

void twr_window_menu_button_add_callback(const struct twr_window_widget* widget, int event_id, void* extraPtr) {
   twrWindowMenuButtonAddCallback(widget->jsid, widget->widget_id, event_id, extraPtr);
}

void twr_window_menu_delete_widget(const struct twr_window_widget* widget) {
   twrWindowMenuDeleteWidget(widget->jsid, widget->widget_id);
}