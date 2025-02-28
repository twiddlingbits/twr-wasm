#include "twr-window.h"
#include "twr-crt.h"
#include <assert.h>
#include <stdlib.h>
#include <string.h>

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

void twr_window_menu_radio_item_merge(const struct twr_window_widget* widget1, const struct twr_window_widget* widget2) {
   assert(widget1->jsid == widget2->jsid);
   twrWindowMenuRadioItemMerge(widget1->jsid, widget1->widget_id, widget2->widget_id);
}

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
      // *ret_str = (char*)val->string;
      *ret_str = strdup(val->string);      
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

void twr_window_menu_widget_fill_in_details(const struct twr_window_widget* widget, struct twr_widget_prop_details* details) {
   assert(details->name != (void*)0);
   twrWindowMenuWidgetGetPropDetails(widget->jsid, widget->widget_id, details);
}
struct twr_widget_prop_details* twr_window_menu_widget_list_props(const struct twr_window_widget* widget, long* length) {
   return twrWindowMenuWidgetListProps(widget->jsid, widget->widget_id, length);
}


struct twr_menu_prop_details* twr_window_menu_list_props(twr_ioconsole_t* window, long* length) {
   return twrWindowMenuListProps(__twr_get_jsid(window), length);
}


struct twr_window_widget twr_window_menu_add_button_widget(const struct twr_window_widget* menu, long width, long height, const char* text) {
   struct twr_widget_button_constructor button_cons = {
      .base = {
         .type = WINDOW_WIDGET_BUTTON,
         .width = width,
         .height = height
      },
      .text = text
   };

   return twr_window_menu_add_widget(menu, &button_cons.base);
}

struct twr_window_widget twr_window_menu_add_seperator_widget(const struct twr_window_widget* menu, long width, long height, const char* seperator_text, const char* seperator_font) {
   struct twr_widget_seperator_constructor seperator_cons = {
      .base = {
         .type = WINDOW_WIDGET_SEPERATOR,
         .height = height,
         .width = width,
      },
      .seperator_text = seperator_text,
      .seperator_font = seperator_font
   };

   return twr_window_menu_add_widget(menu, &seperator_cons.base);
}

struct twr_window_widget twr_window_menu_add_radio_item_widget(const struct twr_window_widget* menu, long width, long height, const char* text) {
   struct twr_widget_radio_item_constructor radio_item_cons = {
      .base = {
         .type = WINDOW_WIDGET_RADIO_ITEM,
         .height = height,
         .width = width,
      },
      .text = text
   };

   return twr_window_menu_add_widget(menu, &radio_item_cons.base);
}

struct twr_window_widget twr_window_menu_add_sub_menu_widget(const struct twr_window_widget* menu, long width, long height, const char* button_text, long minimum_menu_width, long minimum_menu_height) {
   struct twr_widget_sub_menu_constructor sub_menu_cons = {
      .base = {
         .type = WINDOW_WIDGET_SUB_MENU,
         .height = height,
         .width = width
      },
      .button_text = button_text,
      .minimum_menu_width = minimum_menu_width,
      .minimum_menu_height = minimum_menu_height,
   };

   return twr_window_menu_add_widget(menu, &sub_menu_cons.base);
}
struct twr_window_widget twr_window_menu_add_sub_menu_widget_reduced(const struct twr_window_widget* menu, long width, long height, const char* button_text) {
   return twr_window_menu_add_sub_menu_widget(menu, width, height, button_text, -1, -1);
}

struct twr_window_widget twr_window_menu_add_check_box_widget(const struct twr_window_widget* menu, long width, long height, const char* text) {
   struct twr_widget_check_box_constructor check_box_cons = {
      .base = {
         .type = WINDOW_WIDGET_CHECK_BOX,
         .height = height,
         .width = width,
      },
      .text = text,
   };

   return twr_window_menu_add_widget(menu, &check_box_cons.base);
}


struct twr_widget_prop_value* twr_window_menu_get_prop(twr_ioconsole_t* window, const char* prop_name) {
   return twrWindowMenuGetProp(__twr_get_jsid(window), prop_name);
}
int twr_window_menu_get_prop_boolean(twr_ioconsole_t* window, const char* prop_name, int* ret_bool) {
   struct twr_widget_prop_value* ret_val = twr_window_menu_get_prop(window, prop_name);
   int success = ret_val->type == WINDOW_WIDGET_PROP_BOOLEAN;
   if (success)
      *ret_bool = ret_val->boolean;

   free(ret_val);
   return 0;
}
int twr_window_menu_get_prop_boolean_or_default(twr_ioconsole_t* window, const char* prop_name, int def) {
   int ret;
   if (twr_window_menu_get_prop_boolean(window, prop_name, &ret)) {
      return ret;
   } else {
      return def;
   }
}
int twr_window_menu_get_prop_number(twr_ioconsole_t* window, const char* prop_name, double* ret_number) {
   struct twr_widget_prop_value* ret_val = twr_window_menu_get_prop(window, prop_name);
   int success = ret_val->type == WINDOW_WIDGET_PROP_NUMBER;
   if (success)
      *ret_number = ret_val->number;
   
   free(ret_val);
   return success;
}
double twr_window_menu_get_prop_number_or_default(twr_ioconsole_t* window, const char* prop_name, double def) {
   double ret;
   if (twr_window_menu_get_prop_number(window, prop_name, &ret)) {
      return ret;
   } else {
      return def;
   }
}
int twr_window_menu_get_prop_string(twr_ioconsole_t* window, const char* prop_name, char** ret_str) {
   struct twr_widget_prop_value* ret_val = twr_window_menu_get_prop(window, prop_name);
   int success = ret_val->type == WINDOW_WIDGET_PROP_STRING;
   if (success)
      *ret_str = strdup(ret_val->string);

   free(ret_val);
   return success;
}
char* twr_window_menu_get_prop_string_or_default(twr_ioconsole_t* window, const char* prop_name) {
   char* ret;
   if (twr_window_menu_get_prop_string(window, prop_name, &ret)) {
      return ret;
   } else {
      return (char*)0;
   }
}

void twr_window_menu_set_prop(twr_ioconsole_t* window, const char* prop_name, struct twr_widget_prop_value* val) {
   twrWindowMenuSetProp(__twr_get_jsid(window), prop_name, val);
}
void twr_window_menu_set_prop_boolean(twr_ioconsole_t* window, const char* prop_name, int val) {
   twr_window_menu_set_prop(window, prop_name, &(struct twr_widget_prop_value){
      .boolean = val,
      .type = WINDOW_WIDGET_PROP_BOOLEAN,
   });
}
void twr_window_menu_set_prop_number(twr_ioconsole_t* window, const char* prop_name, double val) {
   twr_window_menu_set_prop(window, prop_name, &(struct twr_widget_prop_value){
      .number = val,
      .type = WINDOW_WIDGET_PROP_NUMBER,
   });
}
void twr_window_menu_set_prop_string(twr_ioconsole_t* window, const char* prop_name, const char* val) {
   twr_window_menu_set_prop(window, prop_name, &(struct twr_widget_prop_value){
      .string = (char*)val,
      .type = WINDOW_WIDGET_PROP_STRING,
   });
}