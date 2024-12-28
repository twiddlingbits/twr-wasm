#ifndef __TWR_WINDOW_H__
#define __TWR_WINDOW_H__

#ifdef __cplusplus
extern "C" {
#endif

#include "twr-io.h"

__attribute__((import_name("twrGetAppCanvasJSID"))) int twrGetAppCanvasJSID(int jsid);

twr_ioconsole_t* twr_window_get_app_canvas(twr_ioconsole_t * con);

__attribute__((import_name("twrWindowAddMenu"))) int twrWindowAddMenu(int jsid, const char* text);


struct twr_window_widget {
   int jsid;
   int widget_id;
};


enum WindowWidget {
   WINDOW_WIDGET_BUTTON,
   WINDOW_WIDGET_SEPERATOR,
   WINDOW_WIDGET_RADIO_MENU,
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

/** 
 * Constructor for a radio menu widget: Displays a list of mutually exclusive options that you can select from
 * Any Null or Negative values will be set to their defaults
 */
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
   /**
    * Amount of space before option text reserved for the select symbol
    * defaults to width of (selected_symbol + "  ")
    */
   long reserved_prefix_length;
   /// @brief default to 20
   long option_height;
   /// @brief defaults to 16px Seriph
   const char* option_text_font;
   /// @brief defaults to black
   const char* option_text_color;
};

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
   /// @brief defaults to 16px Seriph
   const char* button_text_font;
   /// @brief defaults to "black"
   const char* button_text_color;
   /// @brief defaults to #B0B0B0
   const char* button_color;
   /// @brief defaults to #D0D0D0
   const char* selected_button_color;

   /// @brief defaults to 10
   long minimum_menu_width;
   /// @brief defaults to 10
   long minimum_menu_height;
   /// @brief defaults to #B0B0B0
   const char* menu_color;
   /// @brief defaults to 5
   long menu_y_padding;
   /// @brief defaults to 10
   long min_child_height;
   /// @brief defaults to black
   const char* menu_border_color;
   /// @brief defaults to 0
   long menu_border_width;
   ///@brief defaults to 0
   long menu_open_offset;
};

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
   /**
    * Text prefix used to indicate that the check box is clicked
    * defaults to *
    */
   const char* checked_symbol;
   /**
    * text prefix used to indicate that the check box is not clicked
    * defaults to ""
    */
   const char* unchecked_symbol;
   /**
    * amount of space to reserve for the checked and unchecked symbol prefixes
    * defaults to max(width(checked_symbol),width(unchecked_symbol)) + width(" ") * 2
    */
   long reserved_prefix_space;
   /// @brief defaults to "16px Seriph"
   const char* text_font;
   /// @brief defaults to "Black"
   const char* text_color;
   /// @brief defaults to #B0B0B0
   const char* button_color;
   /// @brief defaults to #D0D0D0
   const char* selected_button_color;
};


__attribute__((import_name("twrWindowMenuAddWidget"))) int twrWindowMenuAddWidget(int jsid, int menu_id, const struct twr_widget_constructor* widget);
struct twr_window_widget twr_window_menu_add_widget(const struct twr_window_widget* menu, const struct twr_widget_constructor* widget);

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