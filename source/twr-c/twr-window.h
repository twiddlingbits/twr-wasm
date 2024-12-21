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

struct twr_window_widget {
   int jsid;
   int widget_id;
};


enum WindowWidget {
   WINDOW_WIDGET_BUTTON,
   WINDOW_WIDGET_SEPERATOR,
   WINDOW_WIDGET_RADIO_MENU,
};


struct twr_window_menu twr_window_add_menu(twr_ioconsole_t * con, const char* text);


/**
 * Base widget constructor for all widgets.
 * Any Null or Negative values will be set to their defaults
 */
struct twr_widget_constructor {
   /// @brief must be set and matched to the correct widget
   enum WindowWidget type;
   /// @brief Defaults to 0
   long x;
   /// @brief Defaults to 0
   long y;
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
   /// @brief defaults to 16px Seriph
   const char* text_font;
   /// @brief defaults to Black
   const char* text_color;
   /// @brief defaults to #B0B0B0
   const char* button_color;
   /// @brief defaults to #D0D0D0
   const char* selected_button_color;
};

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
   /// @brief defaults to black
   const char* seperator_color;
};

struct twr_widget_radio_menu_constructor {
   /// @brief Base widget constructor
   struct twr_widget_constructor base;
   ///@brief defaults to 0
   long minimum_width;
   /// @brief defaults to 0
   long minimum_height;
   /// @brief defaults to 0
   long y_padding;
   /// @brief defaults to gray
   const char* menu_color;
   /**
    * Color options change to when hovered over
    * defaults to light gray
    */
   const char* hovered_background_color;
   /**
    * Symbol used to denote that the option is selected
    * defaults to *
    */
   const char* selected_symbol;
   /// @brief default to 20
   long option_height;
   /// @brief defaults to 16px Seriph
   const char* option_text_font;
   /// @brief defaults to black
   const char* option_text_color;
};

__attribute__((import_name("twrWindowMenuAddWidget"))) int twrWindowMenuAddWidget(int jsid, int menu_id, const struct twr_widget_constructor* widget);
struct twr_window_widget twr_window_menu_add_widget(const struct twr_window_menu* menu, const struct twr_widget_constructor* widget);

__attribute__((import_name("twrWindowMenuWidgetAddCallback"))) void twrWindowMenuWidgetAddCallback(int jsid, int widget_id, int event_id, void* extraPtr);
void twr_window_menu_widget_add_callback(const struct twr_window_widget* widget, int event_id, void* extraPtr);

__attribute__((import_name("twrWindowMenuDeleteWidget"))) void twrWindowMenuDeleteWidget(int jsid, int widget_id);
void twr_window_menu_delete_widget(const struct twr_window_widget* widget);

__attribute__((import_name("twrWindowMenuRadioMenuAddOption"))) void twrWindowMenuRadioMenuAddOption(int jsid, int widget_id, const char* option);
void twr_window_menu_radio_menu_add_option(struct twr_window_widget* widget, const char* option);
#ifdef __cplusplus
}
#endif

#endif