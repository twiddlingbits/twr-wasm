#ifndef __TWR_WINDOW_H__
#define __TWR_WINDOW_H__

#ifdef __cplusplus
extern "C" {
#endif

#include "twr-io.h"
#include "twr-canvas-events.h"

__attribute__((import_name("twrGetDrawCanvasJSID"))) int twrGetDrawCanvasJSID(int jsid);

twr_ioconsole_t* twr_window_get_draw_canvas(twr_ioconsole_t * con);

__attribute__((import_name("twrWindowAddMenu"))) int twrWindowAddMenu(int jsid, const char* text);


struct twr_window_widget {
   int jsid;
   int widget_id;
};


enum WindowWidget {
   WINDOW_WIDGET_BUTTON,
   WINDOW_WIDGET_SEPERATOR,
   // WINDOW_WIDGET_RADIO_MENU,
   WINDOW_WIDGET_RADIO_ITEM,
   WINDOW_WIDGET_SUB_MENU,
   WINDOW_WIDGET_CHECK_BOX,
};


struct twr_window_widget twr_window_add_menu(twr_ioconsole_t * con, const char* text);


/**
 * Base widget constructor for all widgets.
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_constructor {
   /// @brief must be set and matched to the correct widget
   enum WindowWidget type;
   /// @brief Default depends on widget
   long width;
   /// @brief Default depends on widget
   long height;
};

/** 
 * Constructor for a button widget: Displays a button that can be clicked on for events.
 * Event callbacks are added after construction
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_button_constructor {
   /// @brief Base widget constructor
   struct twr_widget_constructor base;
   /// @brief defaults to "Lorem Ipsum"
   const char* text;
};

/**
 * @brief Adds a button with the given properties to the given menu
 * @param menu: The menu widget this button should be added to
 * @param width: Width of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param height: Height of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param text: Text displayed on button
 * @retval Struct identifying the widget and it's linked window
 */
struct twr_window_widget twr_window_menu_add_button_widget(const struct twr_window_widget* menu, long width, long height, const char* text);

/** 
 * Constructor for a seperator widget: Displays a repeating segment of text to seperate sections
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_seperator_constructor {
   /// @brief Base widget constructor
   struct twr_widget_constructor base;
   /// @brief defaults to "-"
   const char* seperator_text;
   /// @brief defaults to 16px Seriph
   const char* seperator_font;
};
/**
 * @brief Adds a seperator with the given properties to the given menu
 * @param menu: The menu widget this seperator should be added to
 * @param width: Width of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param height: Height of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param seperator_text: Text seperator uses, for instance "-" would fill the width with "-------"
 * @param seperator_font: Font that should be used with the seperator text
 * @retval Struct identifying the widget and it's linked window
 */
struct twr_window_widget twr_window_menu_add_seperator_widget(const struct twr_window_widget* menu, long width, long height, const char* seperator_text, const char* seperator_font);

/** 
 * Constructor for a radio item widget: Items are linked together to have mutually exclusive options
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_radio_item_constructor {
   /// @brief Base widget constructor
   struct twr_widget_constructor base;
   /// @brief defaults to "Lorem Ipsum"
   const char* text;
};
/**
 * @brief Adds a radio item with the given properties to the given menu
 * @param menu: The menu widget this radio item should be added to
 * @param width: Width of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param height: Height of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param text: Text displayed on the radio item
 * @retval Struct identifying the widget and it's linked window
 */
struct twr_window_widget twr_window_menu_add_radio_item_widget(const struct twr_window_widget* menu, long width, long height, const char* text);

/** 
 * Constructor for a sub-menu widget: Holds a list of widgets
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_sub_menu_constructor {
   /// @brief Base widget constructor
   struct twr_widget_constructor base;
   /**
    * Text for the button that opens this menu
    * defaults to Lorem Ipsum
    */
   const char* button_text;
   /// @brief defaults to 10
   long minimum_menu_width;
   /// @brief defaults to 10
   long minimum_menu_height;
};
/**
 * @brief Adds a sub menu button with the given properties to the given menu
 * @param menu: The menu widget this sub menu should be added to
 * @param width: Width of menu button, -1 sets it to default (might be adjusted automatically by menu)
 * @param height: Height of menu button, -1 sets it to default (might be adjusted automatically by menu)
 * @param button_text: Text displayed on the button used to open the sub menu
 * @param minimum_menu_width: The minimum width of the menu when it's opened
 * @param minimum_menu_height: The minimum height of the menu when it's opened
 * @retval Struct identifying the widget and it's linked window
 */
struct twr_window_widget twr_window_menu_add_sub_menu_widget(const struct twr_window_widget* menu, long width, long height, const char* button_text, long minimum_menu_width, long minimum_menu_height);
/**
 * @brief Adds a sub menu button with the given properties to the given menu
 * @param menu: The menu widget this sub menu should be added to
 * @param width: Width of menu button, -1 sets it to default (might be adjusted automatically by menu)
 * @param height: Height of menu button, -1 sets it to default (might be adjusted automatically by menu)
 * @param button_text: Text displayed on the button used to open the sub menu
 * @retval Struct identifying the widget and it's linked window
 */
struct twr_window_widget twr_window_menu_add_sub_menu_widget_reduced(const struct twr_window_widget* menu, long width, long height, const char* button_text);

/** 
 * Constructor for a check box widget: Button with a checkbox that has an event for when it's state changes
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_check_box_constructor {
   /// @brief Base widget constructor
   struct twr_widget_constructor base;
   /**
    * Text for the check box
    * defaults to Lorem Ipsum
    */
   const char* text;
};
/**
 * @brief Adds a check box with the given properties to the given menu
 * @param menu: The menu widget this check box should be added to
 * @param width: Width of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param height: Height of widget, -1 sets it to default (might be adjusted automatically by menu)
 * @param text: Text displayed on the check box
 * @retval Struct identifying the widget and it's linked window
 */
struct twr_window_widget twr_window_menu_add_check_box_widget(const struct twr_window_widget* menu, long width, long height, const char* text);


__attribute__((import_name("twrWindowMenuAddWidget"))) int twrWindowMenuAddWidget(int jsid, int menu_id, const struct twr_widget_constructor* widget);
struct twr_window_widget twr_window_menu_add_widget(const struct twr_window_widget* menu, const struct twr_widget_constructor* widget);

__attribute__((import_name("twrWindowMenuWidgetAddCallback"))) void twrWindowMenuWidgetAddCallback(int jsid, int widget_id, int event_id, void* extraPtr);
void twr_window_menu_widget_add_callback(const struct twr_window_widget* widget, int event_id, void* extraPtr);

__attribute__((import_name("twrWindowMenuDeleteWidget"))) void twrWindowMenuDeleteWidget(int jsid, int widget_id);
void twr_window_menu_delete_widget(const struct twr_window_widget* widget);

__attribute__((import_name("twrWindowMenuRadioItemMerge"))) void twrWindowMenuRadioItemMerge(int jsid, int widget_id1, int widget_id2);
void twr_window_menu_radio_item_merge(const struct twr_window_widget* widget1, const struct twr_window_widget* widget2);


enum WindowWidgetPropVal {
   WINDOW_WIDGET_PROP_STRING = 1, //0b0001
   WINDOW_WIDGET_PROP_BOOLEAN = 2,//0b0010
   WINDOW_WIDGET_PROP_NUMBER = 4, //0b0100
   WINDOW_WIDGET_PROP_UNDEFINED = 8, //0b1000
   // WINDOW_WIDGET_PROP_STRING_OR_UNDEFINED = 9,  //0b1001
   // WINDOW_WIDGET_PROP_BOOLEAN_OR_UNDEFINED = 10,//0b1010
   // WINDOW_WIDGET_PROP_NUMBER_OR_UNDEFINED = 12, //0b1100
};
struct twr_widget_prop_value {
   union {
      const char* string;
      double number;
      int boolean;
   };
   enum WindowWidgetPropVal type;
};
enum WindowWidgetPropAccess {
   WINDOW_WIDGET_PROP_GET = 1,
   WINDOW_WIDGET_PROP_SET = 2,
   WINDOW_WIDGET_PROP_GETANDSET = 3,
};
struct twr_widget_prop_details {
   const char* name;
   enum WindowWidgetPropVal type;
   enum WindowWidgetPropAccess access;
};
__attribute__((import_name("twrWindowMenuWidgetSetProp"))) void twrWindowMenuWidgetSetProp(int jsid, int widget_id, const char* prop_name, const struct twr_widget_prop_value* data);
void twr_window_menu_widget_set_string(const struct twr_window_widget* widget, const char* prop_name, const char* val);
void twr_window_menu_widget_set_bool(const struct twr_window_widget* widget, const char* prop_name, int val);
void twr_window_menu_widget_set_number(const struct twr_window_widget* widget, const char* prop_name, double val);
void twr_window_menu_widget_set_undefined(const struct twr_window_widget* widget, const char* prop_name);

__attribute__((import_name("twrWindowMenuWidgetGetProp"))) struct twr_widget_prop_value* twrWindowMenuWidgetGetProp(int jsid, int widget_id, const char* prop_name);

struct twr_widget_prop_value* twr_window_menu_widget_get_prop(const struct twr_window_widget* widget, const char* prop_name);
/// @brief if type is string, returns 1, otherwise returns 0 and sets ret_str to null ptr
int twr_window_menu_widget_get_prop_string(const struct twr_window_widget* widget, const char* prop_name, char** ret_str);
/// @brief if type is not string, returns null ptr
char* twr_window_menu_widget_get_prop_string_or_null(const struct twr_window_widget* widget, const char* prop_name);
/// @brief if type is not boolean, returns 0
int twr_window_menu_widget_get_prop_boolean(const struct twr_window_widget* widget, const char* prop_name, int* ret_bool);
/// @brief if type is not boolean, returns default value
int twr_window_menu_widget_get_prop_boolean_or_default(const struct twr_window_widget* widget, const char* prop_name, int default_val);
/// @brief if type is not number, returns 1
int twr_window_menu_widget_get_prop_number(const struct twr_window_widget* widget, const char* prop_name, double* ret_number);
/// @brief if type is not number, returns default value
double twr_window_menu_widget_get_prop_number_or_default(const struct twr_window_widget* widget, const char* prop_name, double default_val);

__attribute__((import_name("twrWindowMenuWidgetGetPropDetails"))) void twrWindowMenuWidgetGetPropDetails(int jsid, int widget_id, struct twr_widget_prop_details* details);
/**
 * Given a details struct with the name filled out,
 * this function will fill in the type and access fields of the struct
 */
void twr_window_menu_widget_fill_in_details(const struct twr_window_widget* widget, struct twr_widget_prop_details* details);
__attribute__((import_name("twrWindowMenuWidgetListProps"))) struct twr_widget_prop_details* twrWindowMenuWidgetListProps(int jsid, int widget_id, long* length);
/**
 * Returns an array of twr_widget_prop_details representing the name, access, and types of each property
 * The array of structs and the strings representing their names are made in one large allocation
 */
struct twr_widget_prop_details* twr_window_menu_widget_list_props(const struct twr_window_widget* widget, long* length);


struct twr_menu_prop_details {
   const char* name;
   enum WindowWidgetPropVal type;
};
__attribute__((import_name("twrWindowMenuListProps"))) struct twr_menu_prop_details* twrWindowMenuListProps(int jsid, long* length);
/**
 * returns an array of twr_menu_prop_details representing the name and type of each property
 * The array of structs and the strings representing their names are made in one large allocation
 */
struct twr_menu_prop_details* twr_window_menu_list_props(twr_ioconsole_t* window, long* length);

__attribute__((import_name("twrWindowMenuGetProp"))) struct twr_widget_prop_value* twrWindowMenuGetProp(int jsid, const char* prop_name);
struct twr_widget_prop_value* twr_window_menu_get_prop(twr_ioconsole_t* window, const char* prop_name);
int twr_window_menu_get_prop_boolean(twr_ioconsole_t* window, const char* prop_name, int* ret_bool);
int twr_window_menu_get_prop_boolean_or_default(twr_ioconsole_t* window, const char* prop_name, int def);
int twr_window_menu_get_prop_number(twr_ioconsole_t* window, const char* prop_name, double* ret_number);
double twr_window_menu_get_prop_number_or_default(twr_ioconsole_t* window, const char* prop_name, double def);
int twr_window_menu_get_prop_string(twr_ioconsole_t* window, const char* prop_name, char** ret_str);
char* twr_window_menu_get_prop_string_or_default(twr_ioconsole_t* window, const char* prop_name);

__attribute__((import_name("twrWindowMenuSetProp"))) void twrWindowMenuSetProp(int jsid, const char* prop_name, struct twr_widget_prop_value* val);
void twr_window_menu_set_prop(twr_ioconsole_t* window, const char* prop_name, struct twr_widget_prop_value* val);
void twr_window_menu_set_prop_boolean(twr_ioconsole_t* window, const char* prop_name, int val);
void twr_window_menu_set_prop_number(twr_ioconsole_t* window, const char* prop_name, double val);
void twr_window_menu_set_prop_string(twr_ioconsole_t* window, const char* prop_name, const char* val);


enum TwrWindowEvents {
   TWR_WINDOW_RESIZE_EVENT
};
void twr_window_register_event(twr_ioconsole_t* window, enum TwrWindowEvents event, int event_id);
void twr_window_unregister_event(twr_ioconsole_t* window, enum TwrWindowEvents event, int event_id);
void twr_window_unregiser_all_events(twr_ioconsole_t* window);

#ifdef __cplusplus
}
#endif

#endif