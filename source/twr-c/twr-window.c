#include "twr-window.h"
#include "twr-crt.h"
#include <assert.h>
#include <stdlib.h>

twr_ioconsole_t* twr_window_get_app_canvas(twr_ioconsole_t* con) {
   int id = twrGetAppCanvasJSID(__twr_get_jsid(con));
   return twr_jscon(id);
}

struct twr_window_widget twr_window_add_menu(twr_ioconsole_t * con, const char* text) {
   int id = __twr_get_jsid(con);
   int menu_id = twrWindowAddMenu(id, text);
   return (struct twr_window_widget){
      .jsid = id,
      .widget_id = menu_id,
   };
}

struct twr_window_widget twr_window_menu_add_widget(const struct twr_window_widget* menu, const struct twr_widget_constructor* widget) {
   int widget_id = twrWindowMenuAddWidget(menu->jsid, menu->widget_id, widget);
   return (struct twr_window_widget){
      .jsid = menu->jsid,
      .widget_id = widget_id
   };
}

void twr_window_menu_widget_add_callback(const struct twr_window_widget* widget, int event_id, void* extraPtr) {
   twrWindowMenuWidgetAddCallback(widget->jsid, widget->widget_id, event_id, extraPtr);
}

void twr_window_menu_delete_widget(const struct twr_window_widget* widget) {
   twrWindowMenuDeleteWidget(widget->jsid, widget->widget_id);
}

// void twr_window_menu_radio_menu_add_option(struct twr_window_widget* widget, const char* option) {
//    twrWindowMenuRadioMenuAddOption(widget->jsid, widget->widget_id, option);
// }

void twr_window_menu_radio_item_merge(const struct twr_window_widget* widget1, const struct twr_window_widget* widget2) {
   assert(widget1->jsid == widget2->jsid);
   twrWindowMenuRadioItemMerge(widget1->jsid, widget1->widget_id, widget2->widget_id);
}

// void twr_window_menu_widget_set_visibility(struct twr_window_widget* widget, int visibility) {
//    // twrWindowMenuWidgetSetVisibility(widget->jsid, widget->widget_id, visibility);
//    twr_window_menu_widget_set_bool(widget, "isVisible", visibility);
// }

void twr_window_menu_widget_set_string(const struct twr_window_widget* widget, const char* prop_name, const char* val) {
   // struct twr_widget_prop_value {
   //    enum WindowWidgetPropVal type;
   //    const void* val;
   // };
   struct twr_widget_prop_value prop_val = {
      .string = val,
      .type = WINDOW_WIDGET_PROP_STRING,
   };
   twrWindowMenuWidgetSetProp(widget->jsid, widget->widget_id, prop_name, &prop_val);
}
void twr_window_menu_widget_set_bool(const struct twr_window_widget* widget, const char* prop_name, int val) {
   struct twr_widget_prop_value prop_val = {
      .boolean = val,
      .type = WINDOW_WIDGET_PROP_BOOLEAN,
   };
   twrWindowMenuWidgetSetProp(widget->jsid, widget->widget_id, prop_name, &prop_val);
}
void twr_window_menu_widget_set_number(const struct twr_window_widget* widget, const char* prop_name, double val) {
   struct twr_widget_prop_value prop_val = {
      .number = val,
      .type = WINDOW_WIDGET_PROP_NUMBER,
   };
   twrWindowMenuWidgetSetProp(widget->jsid, widget->widget_id, prop_name, &prop_val);
}
void twr_window_menu_widget_set_undefined(const struct twr_window_widget* widget, const char* prop_name) {
   struct twr_widget_prop_value prop_val = {
      .type = WINDOW_WIDGET_PROP_UNDEFINED,
   };
   twrWindowMenuWidgetSetProp(widget->jsid, widget->widget_id, prop_name, &prop_val);
}

struct twr_widget_prop_value* twr_window_menu_widget_get_prop(const struct twr_window_widget* widget, const char* prop_name) {
   return twrWindowMenuWidgetGetProp(widget->jsid, widget->widget_id, prop_name);
}

int twr_window_menu_widget_get_prop_string(const struct twr_window_widget* widget, const char* prop_name, char** ret_str) {
   struct twr_widget_prop_value* val = twr_window_menu_widget_get_prop(widget, prop_name);
   if (val->type == WINDOW_WIDGET_PROP_STRING) {
      *ret_str = (char*)val->string;
      free(val);
      return 1;
   } else {
      free(val);
      *ret_str = NULL;
      return 0;
   }
}
char* twr_window_menu_widget_get_prop_string_or_null(const struct twr_window_widget* widget, const char* prop_name) {
   char* str;
   if (twr_window_menu_widget_get_prop_string(widget, prop_name, &str)) {
      return str;
   } else {
      return NULL;
   }
}
int twr_window_menu_widget_get_prop_boolean(const struct twr_window_widget* widget, const char* prop_name, int* ret_bool) {
   struct twr_widget_prop_value* val = twr_window_menu_widget_get_prop(widget, prop_name);
   if (val->type == WINDOW_WIDGET_PROP_BOOLEAN) {
      *ret_bool = val->boolean;
      free(val);
      return 1;
   } else {
      free(val);
      *ret_bool = false;
      return 0;
   }
}
int twr_window_menu_widget_get_prop_boolean_or_default(const struct twr_window_widget* widget, const char* prop_name, int default_val) {
   int ret = 0;
   if (twr_window_menu_widget_get_prop_boolean(widget, prop_name, &ret)) {
      return ret;
   } else {
      return default_val;
   }
}
int twr_window_menu_widget_get_prop_number(const struct twr_window_widget* widget, const char* prop_name, double *ret_number) {
   struct twr_widget_prop_value* val = twr_window_menu_widget_get_prop(widget, prop_name);
   if (val->type == WINDOW_WIDGET_PROP_NUMBER) {
      *ret_number = val->number;
      free(val);
      return 1;
   } else {
      free(val);
      *ret_number = -1.0;
      return 0;
   }
}
double twr_window_menu_widget_get_prop_number_or_default(const struct twr_window_widget* widget, const char* prop_name, double default_val) {
   double ret = 0;
   if (twr_window_menu_widget_get_prop_number(widget, prop_name, &ret)) {
      return ret;
   } else {
      return default_val;
   }
}
