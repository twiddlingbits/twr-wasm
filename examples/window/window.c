#include "twr-window.h"
#include "twr-draw2d.h"
#include "twr-crt.h"
#include "stdlib.h"
#include "string.h"
#include <ctype.h>

twr_ioconsole_t* window_con = NULL;
twr_ioconsole_t* canvas_con = NULL;

long canvas_width = 0;
long canvas_height = 0;


struct twr_window_widget box_color_menu;
struct twr_window_widget test_two_menu;
struct twr_window_widget extra_menu;
struct twr_window_widget prop_menu;
struct twr_window_widget menu_prop_menu;
unsigned long box_color = 0xFF0000FF;
const long WIDGET_HEIGHT = 15;
int box_border = 0;

#define COLORS_LEN 76
const char* COLORS[COLORS_LEN] = {
   "Salmon",
   "Red",
   "DarkRed",
   "Pink",
   "DeepPink",
   "MediumVioletRed",
   "Coral",
   "Tomato",
   "OrangeRed",
   "Orange",
   "Gold",
   "Yellow",
   "LightYellow",
   "DarkKhaki",
   "Lavender",
   "Thistle",
   "Violet",
   "Fuchsia",
   "Magenta",
   "MediumOrchid",
   "MediumPurple",
   "RebeccaPurple",
   "DarkMagenta",
   "Purple",
   "Indigo",
   "SlateBlue",
   "DarkSlateBlue",
   "GreenYellow",
   "LimeGreen",
   "LightGreen",
   "MediumSpringGreen",
   "MediumSeaGreen",
   "Green",
   "OliveDrab",
   "Olive",
   "MediumAquamarine",
   "LightSeaGreen",
   "DarkCyan",
   "Aqua",
   "PaleTurquiose",
   "Aquamarine",
   "CadetBlue",
   "SteelBlue",
   "LightSteelBlue",
   "DeepSkyBlue",
   "DodgetBlue",
   "MediumSlateBlue",
   "RoyalBlue",
   "Blue",
   "Navy",
   "BurlyWood",
   "RosyBrown",
   "SandyBrown",
   "Goldenrod",
   "DarkGoldenrod",
   "Peru",
   "Chocolate",
   "SaddleBrown",
   "Sienna",
   "Brown",
   "Maroon",
   "White",
   "GhostWhite",
   "SeaShell",
   "Biege",
   "Ivory",
   "MistyRose",
   "Gainsboro",
   "LightGray",
   "Silver",
   "Gray",
   "DimGray",
   "LightSlateGray",
   "SlateGray",
   "DarkSlateGray",
   "Black"
}; 
unsigned long box_center_dot_color_index = 0;
int box_center_dot = 0;

struct twr_window_widget spawn_button;
int delete_button_callback;

struct DynamicWidgetArray {
   struct twr_window_widget* arr;
   unsigned long len;
};

enum MOUSE_EVENT_TYPE {
   MOUSE_EVENT_MOVE,
   MOUSE_EVENT_LEFT_CLICK,
   MOUSE_EVENT_DOUBLE_CLICK,
};
int mouse_event_ids[3] = {};
enum MOUSE_EVENT_TYPE box_move_event_type = MOUSE_EVENT_MOVE;

void setup_box_options_menu(struct twr_window_widget *box_options_menu);
void setup_test_two_menu(struct twr_window_widget *test_two_menu);
void setup_extra_menu(struct twr_window_widget *extra_menu);
void setup_prop_menu(struct twr_window_widget *prop_menu);
void setup_menu_prop_menu(struct twr_window_widget *menu_prop_menu);
__attribute__((export_name("init")))
void init() {
   if (window_con)
      free(window_con);
   
   if (canvas_con)
      free(canvas_con);
   
   window_con = twr_get_console("window");
   canvas_con = twr_window_get_draw_canvas(window_con);

   twr_set_std2d_con(canvas_con);

   canvas_width = io_get_prop(canvas_con, "canvasWidth");
   canvas_height = io_get_prop(canvas_con, "canvasHeight");

   printf("canvas size: %ld, %ld\n", canvas_width, canvas_height);

   int ANIMATION_EVENT = twr_register_callback("animationFrame");
   d2d_register_event(D2D_ANIMATION_FRAME, ANIMATION_EVENT);



   int MOUSE_MOVE_EVENT = twr_register_callback("mouseMoveHandler");
   d2d_register_event(D2D_MOUSE_MOVE, MOUSE_MOVE_EVENT);
   mouse_event_ids[MOUSE_EVENT_MOVE] = MOUSE_MOVE_EVENT;

   int MOUSE_LEFT_CLICK_EVENT = twr_register_callback("mouseMoveHandler");
   d2d_register_event(D2D_MOUSE_CLICK, MOUSE_LEFT_CLICK_EVENT);
   mouse_event_ids[MOUSE_EVENT_LEFT_CLICK] = MOUSE_LEFT_CLICK_EVENT;

   int MOUSE_DBL_CLICK_EVENT = twr_register_callback("mouseMoveHandler");
   d2d_register_event(D2D_MOUSE_DBLCLICK, MOUSE_DBL_CLICK_EVENT);
   mouse_event_ids[MOUSE_EVENT_DOUBLE_CLICK] = MOUSE_DBL_CLICK_EVENT;

   int KEY_PRESS_EVENT = twr_register_callback("keyEventHandler");
   d2d_register_event(D2D_KEY_DOWN, KEY_PRESS_EVENT);

   int WINDOW_RESIZE_EVENT = twr_register_callback("windowResizeHandler");
   twr_window_register_event(window_con, TWR_WINDOW_RESIZE_EVENT, WINDOW_RESIZE_EVENT);



   box_color_menu = twr_window_add_menu(window_con, "Box Options");
   test_two_menu = twr_window_add_menu(window_con, "test_two");
   extra_menu = twr_window_add_menu(window_con, "extra");
   prop_menu = twr_window_add_menu(window_con, "prop_modifiers");
   menu_prop_menu = twr_window_add_menu(window_con, "Menu_Prop_Menu");

   setup_box_options_menu(&box_color_menu);
   setup_test_two_menu(&test_two_menu);
   setup_extra_menu(&extra_menu);
   setup_prop_menu(&prop_menu);
   setup_menu_prop_menu(&menu_prop_menu);
}

int square_x = 75;
int square_y = 75;
int SQUARE_WIDTH = 50;
int SQUARE_HEIGHT = 50;
void force_square_into_bounds() {
   //ensure it's within the bottom right bounds
   if (square_x + SQUARE_WIDTH > canvas_width) {
      square_x = canvas_width - SQUARE_WIDTH;
   }
   if (square_y + SQUARE_HEIGHT >canvas_height) {
      square_y = canvas_height - SQUARE_HEIGHT;
   }

   //ensure if it's within the top left bounds
   // top left is checked seperately so it's prioritized over the bottom right bounds
   if (square_x < 0) {
      square_x = 0;
   }
   if (square_y < 0) {
      square_y = 0;
   }
}
__attribute__((export_name("windowResizeHandler")))
void window_resize_handler(int event_id, long width, long height) {
   canvas_width = io_get_prop(canvas_con, "canvasWidth");
   canvas_height = io_get_prop(canvas_con, "canvasHeight");

   printf("new canvas size: %ld, %ld\n", canvas_width, canvas_height);

   force_square_into_bounds();
}

struct prop_menu_data {
   struct twr_window_widget* widget;
   struct twr_widget_prop_details* prop_details;
};


enum prop_menu_state {
   PROP_MENU_UNOPENED,
   PROP_MENU_SET,
   PROP_MENU_GET
};
enum prop_menu_selected {
   PROP_MENU_SELECTED_TRUE,
   PROP_MENU_SELECTED_FALSE,
   PROP_MENU_SELECTED_UNDEFINED,
   PROP_MENU_SELECTED_NUMBER,
   PROP_MENU_SELECTED_STRING
};
enum prop_menu_target {
   PROP_MENU_TARGET_WIDGET,
   PROP_MENU_TARGET_MENU
};
struct text_fill_buffer {
   char text[100];
   int length;
};
void append_to_text_fill_buffer(struct text_fill_buffer* buffer, char ch) {
   assert(buffer->length < 99);
   if (buffer->length < 99) {
      buffer->text[buffer->length] = ch;
      buffer->length++;
      buffer->text[buffer->length] = '\0';
   }
}
bool try_pop_from_text_fill_buffer(struct text_fill_buffer* buffer, char* ret_ch) {
   if (buffer->length > 0) {
      *ret_ch = buffer->text[buffer->length-1];
      buffer->length--;
      buffer->text[buffer->length] = '\0';
      return TRUE;
   } else {
      return FALSE;
   }
}
struct prop_menu_popup {
   const char* prop_name;
   enum prop_menu_state state;
   enum prop_menu_target target;
   struct text_fill_buffer text_buffer;
   struct text_fill_buffer number_buffer;
   bool number_buffer_has_dot;
   enum prop_menu_selected accepted_types[5];
   int accepted_types_len;
   int selected_type;
   struct twr_window_widget* widget;
   long width, height;
};
const int BASE_PROP_MENU_HEIGHT = 25;
const int PROP_MENU_HEIGHT_PER_FIELD = 25;
const int POPUP_TITLE_HEIGHT = 20;
struct prop_menu_popup prop_menu_data = {
   .state = PROP_MENU_UNOPENED
};
void set_prop_menu_data_to_getter(const char* prop_name, const struct twr_widget_prop_value* val, enum prop_menu_target target) {
   prop_menu_data.state = PROP_MENU_GET;
   prop_menu_data.target = target;
   // prop_menu_data.selected = PROP_MENU_SELECTED_NONE;
   prop_menu_data.prop_name = prop_name;
   prop_menu_data.width = 200;
   prop_menu_data.height = BASE_PROP_MENU_HEIGHT + PROP_MENU_HEIGHT_PER_FIELD;
   switch (val->type) {
      case WINDOW_WIDGET_PROP_BOOLEAN:
         sprintf(prop_menu_data.text_buffer.text, "%s", val->boolean ? "true" : "false");
      break;
      case WINDOW_WIDGET_PROP_NUMBER:
         sprintf(prop_menu_data.text_buffer.text, "%f", val->number);
      break;
      case WINDOW_WIDGET_PROP_STRING:
         sprintf(prop_menu_data.text_buffer.text, "%s", val->string);
      break;
      case WINDOW_WIDGET_PROP_UNDEFINED:
         sprintf(prop_menu_data.text_buffer.text, "undefined");
      break;
   }
}
__attribute__((export_name("windowPropMenuGetEvent")))
void window_prop_menu_get_event(int event_id, struct prop_menu_data* prop_data) {
   struct twr_widget_prop_value* val = twr_window_menu_widget_get_prop(prop_data->widget, prop_data->prop_details->name);

   set_prop_menu_data_to_getter(prop_data->prop_details->name, val, PROP_MENU_TARGET_WIDGET);

   free(val);
}
unsigned int count_ones(unsigned int n) {
   int i = 0;
   for (; n > 0; n &= (n - 1), i++);
   return i;
}
void set_prop_menu_data_to_setter(const char* prop_name, struct twr_window_widget* widget, enum WindowWidgetPropVal combined_types, enum prop_menu_target target) {
   prop_menu_data = (struct prop_menu_popup){
      .prop_name = prop_name,
      .state = PROP_MENU_SET,
      .target = target,
      .text_buffer = (struct text_fill_buffer){
         .text = "",
         .length = 0
      },
      .number_buffer = (struct text_fill_buffer){
         .text = "",
         .length = 0
      },
      .number_buffer_has_dot = FALSE,
      // .accepted_types = accepted_types,
      // .accepted_types_len = accepted_types_length,
      .accepted_types_len = 0,
      .selected_type = 0,
      .widget = widget,
      .width = 200,
      .height = BASE_PROP_MENU_HEIGHT + PROP_MENU_HEIGHT_PER_FIELD * count_ones((unsigned int)combined_types),
   };
   const int num_types = 4;
   const enum WindowWidgetPropVal types[] = {
      WINDOW_WIDGET_PROP_STRING,
      WINDOW_WIDGET_PROP_BOOLEAN,
      WINDOW_WIDGET_PROP_NUMBER,
      WINDOW_WIDGET_PROP_UNDEFINED
   };
   for (int i = 0; i < num_types; i++) {
      if (combined_types & types[i]) {
         enum prop_menu_selected to_add;
         switch (types[i]) {
            case WINDOW_WIDGET_PROP_STRING:
               to_add = PROP_MENU_SELECTED_STRING;
            break;
            case WINDOW_WIDGET_PROP_BOOLEAN:
            prop_menu_data.accepted_types[prop_menu_data.accepted_types_len] = PROP_MENU_SELECTED_TRUE;
               prop_menu_data.accepted_types_len++;
               to_add = PROP_MENU_SELECTED_FALSE;
            break;
            case WINDOW_WIDGET_PROP_NUMBER:
               to_add = PROP_MENU_SELECTED_NUMBER;
            break;
            case WINDOW_WIDGET_PROP_UNDEFINED:
               to_add = PROP_MENU_SELECTED_UNDEFINED;
            break;
         }
         prop_menu_data.accepted_types[prop_menu_data.accepted_types_len] = to_add;
         prop_menu_data.accepted_types_len++;
      }
   }
}
__attribute__((export_name("windowPropMenuSetEvent")))
void window_prop_menu_set_event(int event_id, struct prop_menu_data* prop_data) {
   set_prop_menu_data_to_setter(prop_data->prop_details->name, prop_data->widget, prop_data->prop_details->type, PROP_MENU_TARGET_WIDGET);
}
void setup_prop_menu(struct twr_window_widget *prop_menu) {
   struct twr_window_widget modified_prop = twr_window_menu_add_check_box_widget(prop_menu, WIDGET_HEIGHT, "Test Widget");
   struct twr_window_widget* modified_prop_heap = (struct twr_window_widget*)malloc(sizeof(struct twr_window_widget));
   *modified_prop_heap = modified_prop;

   struct twr_window_widget setter_menu = twr_window_menu_add_sub_menu_widget_reduced(prop_menu, WIDGET_HEIGHT, "Setters");
   struct twr_window_widget getter_menu = twr_window_menu_add_sub_menu_widget_reduced(prop_menu, WIDGET_HEIGHT, "Getters");

   
   long prop_len;
   struct twr_widget_prop_details* props = twr_window_menu_widget_list_props(&modified_prop, &prop_len);
   int getter_event_id = twr_register_callback("windowPropMenuGetEvent");
   int setter_event_id = twr_register_callback("windowPropMenuSetEvent");
   // printf("C alloc: %d\nC Length: %ld\n", (int)props, prop_len);
   for (long i = 0; i < prop_len; i++) {
      struct prop_menu_data* prop_data = (struct prop_menu_data*)malloc(sizeof(struct prop_menu_data));
      *prop_data = (struct prop_menu_data){
         .prop_details = &(props[i]),
         .widget = modified_prop_heap,
      };
      if (prop_data->prop_details->access & WINDOW_WIDGET_PROP_GET) {
         struct twr_window_widget get_button = twr_window_menu_add_button_widget(
            &getter_menu, 
            WIDGET_HEIGHT, 
            prop_data->prop_details->name
         );
         twr_window_menu_widget_add_callback(&get_button, getter_event_id, (void*)prop_data);
      }
      if (prop_data->prop_details->access & WINDOW_WIDGET_PROP_SET) {
         struct twr_window_widget set_button = twr_window_menu_add_button_widget(
            &setter_menu,
            WIDGET_HEIGHT,
            prop_data->prop_details->name
         );
         twr_window_menu_widget_add_callback(&set_button, setter_event_id, (void*)prop_data);
      }
   }
   // free(props);
}


__attribute__((export_name("boxColorChanged")))
void box_color_changed(int event_id, void* extra, int selected) {
   if (selected)
      box_color = (int)extra;
}

void setup_box_color_sub_menu(struct twr_window_widget* box_color_sub_menu) {
   const char* BOX_COLOR_NAMES[20] = {
      "Red",
      "Blue",
      "Magenta",
      "Yellow",
      "Cyan",
      "Teal"
   };
   const int BOX_COLOR_VALUES[] = {
      0xFF0000FF,
      0x0000FFFF,
      0xFF00FFFF,
      0xFFFF00FF,
      0x00FFFFFF,
      0x008080FF
   };
   int box_color_event = twr_register_callback("boxColorChanged");
   struct twr_window_widget root_radio_item;
   for (int i = 0; i < 6; i++) {
      struct twr_window_widget radioItem = twr_window_menu_add_radio_item_widget(box_color_sub_menu, WIDGET_HEIGHT, BOX_COLOR_NAMES[i]);
      twr_window_menu_widget_add_callback(&radioItem, box_color_event, (void*)(BOX_COLOR_VALUES[i]));

      if (i == 0) {
         root_radio_item = radioItem;
      } else {
         twr_window_menu_radio_item_merge(&root_radio_item, &radioItem);
      }
   }
}
void setup_box_options_menu(struct twr_window_widget* box_options_menu) {
   struct twr_window_widget box_color_sub_menu = twr_window_menu_add_sub_menu_widget_reduced(box_options_menu, WIDGET_HEIGHT, "Box Color");
   setup_box_color_sub_menu(&box_color_sub_menu);

   struct twr_window_widget check_box = twr_window_menu_add_check_box_widget(box_options_menu, WIDGET_HEIGHT, "Box Outline");
   int check_box_event = twr_register_callback("boxBorderChanged");
   twr_window_menu_widget_add_callback(&check_box, check_box_event, (void*)0);
}


__attribute__((export_name("spawnButtonPressed")))
void spawn_button_pressed(int event_id, void* ptr) {
   struct twr_window_widget button = twr_window_menu_add_button_widget(
      &test_two_menu,
      WIDGET_HEIGHT,
      "Delete!"
   );
   struct twr_window_widget* heap_button = (struct twr_window_widget*)malloc(sizeof(struct twr_window_widget));
   memcpy(heap_button, &button, sizeof(struct twr_window_widget));

   printf("spawned new button: %d\n", button.widget_id);

   char name[30] = "";
   sprintf(name, "Delete Button: %d", button.widget_id);
   twr_window_menu_widget_set_string(&button, "text", name);

   twr_window_menu_widget_add_callback(&button, delete_button_callback, (void*)heap_button);
}
__attribute__((export_name("deleteButtonPressed")))
void delete_button_pressed(int event_id, struct twr_window_widget* button) {
   char name[30] = "";
   sprintf(name, "Delete Button: %d", button->widget_id);

   char* real_name;
   assert(twr_window_menu_widget_get_prop_string(button, "text", &real_name));
   assert(strcmp(name, real_name) == 0);

   free(real_name);
   twr_window_menu_delete_widget(button);
   free(button);
}

void setup_test_two_menu(struct twr_window_widget *test_two_menu) {
   spawn_button = twr_window_menu_add_button_widget(
      test_two_menu,
      WIDGET_HEIGHT,
      "Spawn New Button"
   );

   int spawn_button_callback = twr_register_callback("spawnButtonPressed");
   twr_window_menu_widget_add_callback(&spawn_button, spawn_button_callback, (void*)0);
   delete_button_callback = twr_register_callback("deleteButtonPressed");

   twr_window_menu_add_seperator_widget(test_two_menu, WIDGET_HEIGHT, "-", NULL);
}

void set_widget_visibility(struct twr_window_widget* widget, int visibility) {
   twr_window_menu_widget_set_bool(widget, "isVisible", visibility);
}

void setup_extra_box_movement_sub_menu(struct twr_window_widget* box_movement_menu) {
   struct DynamicWidgetArray* extra_box_movement_items = (struct DynamicWidgetArray*)malloc(sizeof(struct DynamicWidgetArray));
   extra_box_movement_items->len = 4;
   extra_box_movement_items->arr = (struct twr_window_widget*)malloc(sizeof(struct twr_window_widget) * extra_box_movement_items->len);

   struct twr_window_widget extra_box_movement_show_box = twr_window_menu_add_check_box_widget(box_movement_menu, WIDGET_HEIGHT, "Show");

   extra_box_movement_items->arr[0] = twr_window_menu_add_seperator_widget(box_movement_menu, WIDGET_HEIGHT, "-", NULL);

   const char* MOUSE_MOVE_METHOD_NAMES[3] = {
      "On Mouse Movement",
      "On Left Click",
      "On Double Click"
   };
   const enum MOUSE_EVENT_TYPE MOUSE_MOVE_METHOD_TYPES[] = {
      MOUSE_EVENT_MOVE,
      MOUSE_EVENT_LEFT_CLICK,
      MOUSE_EVENT_DOUBLE_CLICK
   };
   struct twr_window_widget root_radio_item;
   int extra_box_movement_options_event_id = twr_register_callback("extraBoxMovementOptionCallback");
   for (int i = 0; i < 3; i++) {
      struct twr_window_widget radio_item = twr_window_menu_add_radio_item_widget(box_movement_menu, WIDGET_HEIGHT, MOUSE_MOVE_METHOD_NAMES[i]);
      twr_window_menu_widget_add_callback(&radio_item, extra_box_movement_options_event_id, (void*)MOUSE_MOVE_METHOD_TYPES[i]);
      if (i == 0) {
         root_radio_item = radio_item;
      } else {
         twr_window_menu_radio_item_merge(&root_radio_item, &radio_item);
      }
      extra_box_movement_items->arr[i+1] = radio_item;
   }

   for (int i = 0; i < extra_box_movement_items->len; i++) {
      set_widget_visibility(&extra_box_movement_items->arr[i], 0);
   }

   int visibility_event_id = twr_register_callback("extraCheckBoxCallback");
   twr_window_menu_widget_add_callback(&extra_box_movement_show_box, visibility_event_id, (void*)extra_box_movement_items);

}

void setup_extra_menu(struct twr_window_widget *extra_menu) {
   struct twr_window_widget extra_check_box = twr_window_menu_add_check_box_widget(extra_menu, WIDGET_HEIGHT, "Show Extra Options");
   int extra_checkbox_event_id = twr_register_callback("extraCheckBoxCallback");

   struct DynamicWidgetArray* extra_widget_array = (struct DynamicWidgetArray*)malloc(sizeof(struct DynamicWidgetArray));
   extra_widget_array->len = 4;
   extra_widget_array->arr = (struct twr_window_widget*)malloc(sizeof(struct twr_window_widget) * extra_widget_array->len);

   extra_widget_array->arr[0] = twr_window_menu_add_seperator_widget(extra_menu, WIDGET_HEIGHT, "-", NULL);

   struct twr_window_widget extra_center_dot_checkbox = twr_window_menu_add_check_box_widget(extra_menu, WIDGET_HEIGHT, "Centered Dot");
   int extra_center_dot_event_id = twr_register_callback("extraCenterDotCallback");
   twr_window_menu_widget_add_callback(&extra_center_dot_checkbox, extra_center_dot_event_id, (void*)0);
   extra_widget_array->arr[1] = extra_center_dot_checkbox;

   struct twr_window_widget randomize_center_dot_color = twr_window_menu_add_button_widget(
      extra_menu,
      WIDGET_HEIGHT,
      "Randomize Center Dot Color"
   );
   int randomize_center_dot_color_event_id = twr_register_callback("randomizeCenterDotColorCallback");
   twr_window_menu_widget_add_callback(&randomize_center_dot_color, randomize_center_dot_color_event_id, (void*)0);
   extra_widget_array->arr[2] = randomize_center_dot_color;

   struct twr_window_widget extra_box_movement_menu = twr_window_menu_add_sub_menu_widget_reduced(extra_menu, WIDGET_HEIGHT, "Box Movement");
   setup_extra_box_movement_sub_menu(&extra_box_movement_menu);
   extra_widget_array->arr[3] = extra_box_movement_menu;

   twr_window_menu_widget_add_callback(&extra_check_box, extra_checkbox_event_id, (void*)extra_widget_array);

   for (int i = 0; i < extra_widget_array->len; i++) {
      set_widget_visibility(&extra_widget_array->arr[i], 0);
   }
}

void setup_menu_prop_menu(struct twr_window_widget *menu_prop_menu) {
   struct twr_window_widget getters = twr_window_menu_add_sub_menu_widget_reduced(menu_prop_menu, WIDGET_HEIGHT, "Getters");
   struct twr_window_widget setters = twr_window_menu_add_sub_menu_widget_reduced(menu_prop_menu, WIDGET_HEIGHT, "Setters");

   long length = 0;
   struct twr_menu_prop_details* prop_list =  twr_window_menu_list_props(window_con, &length);
   
   int getter_event_id = twr_register_callback("menuPropMenuGetterCallback");
   int setter_event_id = twr_register_callback("menuPropMenuSetterCallback");
   for (long i = 0; i < length; i++) {
      struct twr_window_widget getter = twr_window_menu_add_button_widget(&getters, WIDGET_HEIGHT, prop_list[i].name);
      struct twr_window_widget setter = twr_window_menu_add_button_widget(&setters, WIDGET_HEIGHT, prop_list[i].name);

      twr_window_menu_widget_add_callback(&getter, getter_event_id, (void*)&prop_list[i]);
      twr_window_menu_widget_add_callback(&setter, setter_event_id, (void*)&prop_list[i]);
   }
}

__attribute__((export_name("menuPropMenuSetterCallback")))
void menu_prop_menu_setter_callback(int event_id, struct twr_menu_prop_details* details) {
   set_prop_menu_data_to_setter(details->name, NULL, details->type, PROP_MENU_TARGET_MENU);
}
__attribute__((export_name("menuPropMenuGetterCallback")))
void menu_prop_menu_getter_callback(int event_id, struct twr_menu_prop_details* details) {
   struct twr_widget_prop_value* val = twr_window_menu_get_prop(window_con, details->name);

   set_prop_menu_data_to_getter(details->name, val, PROP_MENU_TARGET_MENU);

   free(val);
}
__attribute__((export_name("extraBoxMovementOptionCallback")))
void extra_box_movement_option_callback(int event_id, void* extra, int selected) {
   if (selected)
      box_move_event_type = (enum MOUSE_EVENT_TYPE)extra;
}
__attribute__((export_name("randomizeCenterDotColorCallback")))
void randomize_center_dot_color_callback(int event_id, void* _) {
   box_center_dot_color_index = rand()%COLORS_LEN;
}
__attribute__((export_name("extraCenterDotCallback")))
void extra_center_dot_callback(int event_id, void* _, int new_state) {
   printf("center box change! %d\n", new_state);
   box_center_dot = new_state;
}

__attribute__((export_name("extraCheckBoxCallback")))
void extra_check_box_callback(int event_id, struct DynamicWidgetArray* arr, int new_state) {
   for (int i = 0; i < arr->len; i++) {
      set_widget_visibility(&arr->arr[i], new_state);
   }
}
__attribute__((export_name("boxBorderChanged")))
void box_border_changed(int event_id, void* _, int new_state) {
   printf("new box border update! %d\n", new_state);
   box_border = new_state;
}



__attribute__((export_name("animationFrame")))
void animation_frame(int id, int delta) {
   struct d2d_draw_seq* ds = d2d_start_draw_sequence(100);

   d2d_clearrect(ds, 0, 0, 1000, 1000);

   d2d_setfillstylergba(ds, 0x00FF00FF);
   d2d_fillrect(ds, 0, 0, canvas_width, canvas_height);

   d2d_setfillstylergba(ds, box_color);
   d2d_fillrect(ds, square_x, square_y, SQUARE_WIDTH, SQUARE_HEIGHT);

   d2d_setstrokestylergba(ds, 0x000000FF);
   d2d_setlinewidth(ds, 4.0);
   if (box_border) {
      d2d_strokerect(ds, square_x, square_y, SQUARE_WIDTH, SQUARE_HEIGHT);
   }

   d2d_setfillstyle(ds, COLORS[box_center_dot_color_index]);
   if (box_center_dot) {
      d2d_fillrect(ds, square_x + SQUARE_WIDTH/2.0 - 5.0, square_y + SQUARE_HEIGHT/2.0 - 5.0, 10.0, 10.0);
   }

   if (prop_menu_data.state != PROP_MENU_UNOPENED) {
      int m_x = (canvas_width - prop_menu_data.width)/2;
      int m_y = (canvas_height - prop_menu_data.height)/2;

      // printf("((%ld, %ld) + (%d, %d))/2 = (%d, %d)\n", canvas_width, canvas_height, prop_menu_data.width, prop_menu_data.height, m_x, m_y);
      d2d_setfillstylergba(ds, 0xC0C0C0FF);
      d2d_fillrect(ds, m_x, m_y, prop_menu_data.width, prop_menu_data.height);

      d2d_setfillstylergba(ds, 0x808080FF);
      d2d_fillrect(ds, m_x, m_y, prop_menu_data.width, POPUP_TITLE_HEIGHT);

      const int text_offset = 5;
      d2d_setfont(ds, "16px Seriph");
      d2d_setfillstylergba(ds, 0xFFFFFFFF);
      d2d_filltext(ds, prop_menu_data.prop_name, m_x, m_y+text_offset);

      d2d_setfont(ds, "12px Seriph");
      d2d_setfillstylergba(ds, 0x000000FF);
      const int x_offset = 5;
      if (prop_menu_data.state == PROP_MENU_GET) {
         char buffer[110];
         sprintf(buffer, "value: %s", prop_menu_data.text_buffer.text);
         d2d_filltext(
            ds, 
            buffer, 
            m_x + x_offset, 
            m_y + (prop_menu_data.height + POPUP_TITLE_HEIGHT)/2
         );
      } else {
         int row = 0;
         
         int height_per_row = (prop_menu_data.height - POPUP_TITLE_HEIGHT)/prop_menu_data.accepted_types_len;
         int height_offset = m_y + POPUP_TITLE_HEIGHT;
         for (int i = 0; i < prop_menu_data.accepted_types_len; i++) {
            enum prop_menu_selected selected_type = prop_menu_data.accepted_types[prop_menu_data.selected_type];
            switch (prop_menu_data.accepted_types[i]) {
               case PROP_MENU_SELECTED_TRUE:
               //don't run for true, only false since it renders both
               break;
               case PROP_MENU_SELECTED_FALSE:
               {
                  char buffer[30];
                  sprintf(
                     buffer,
                     "%s true\t%s false",
                     selected_type == PROP_MENU_SELECTED_TRUE ? "*" : "  ",
                     selected_type == PROP_MENU_SELECTED_FALSE ? "*" : "  "
                  );
                  
                  d2d_filltext(
                     ds, 
                     buffer, 
                     m_x + x_offset,
                     height_offset + height_per_row*row + text_offset
                  );
               }
               break;
               case PROP_MENU_SELECTED_UNDEFINED:
               {
                  char buffer[30];
                  sprintf(
                     buffer,
                     "%s undefined",
                     selected_type == PROP_MENU_SELECTED_UNDEFINED ? "*" : "  "
                  );
                  
                  d2d_filltext(
                     ds, 
                     buffer, 
                     m_x + x_offset,
                     height_offset + height_per_row*row + text_offset
                  );
               }
               break;
               case PROP_MENU_SELECTED_NUMBER:
               {
                  d2d_filltext(
                     ds, 
                     selected_type == PROP_MENU_SELECTED_NUMBER ? "* number: " : "  number: ", 
                     m_x + x_offset,
                     height_offset + height_per_row*row + text_offset
                  );
                  const int text_box_offset = 60;
                  const int inner_text_offset = 5;
                  d2d_setfillstylergba(ds, 0xFFFFFFFF);
                  d2d_fillrect(
                     ds,
                     m_x + x_offset + text_box_offset,
                     height_offset + height_per_row*row + 2,
                     prop_menu_data.width - x_offset*2 - text_box_offset,
                     height_per_row - 2
                  );
                  d2d_setfillstylergba(ds, 0x000000FF);
                  d2d_filltext(
                     ds,
                     prop_menu_data.number_buffer.text,
                     m_x + x_offset + text_box_offset + inner_text_offset,
                     height_offset + height_per_row*row + text_offset
                  );
               }
               break;

               case PROP_MENU_SELECTED_STRING:
               {
                  d2d_filltext(
                     ds, 
                     selected_type == PROP_MENU_SELECTED_STRING ? "* string: " : "   string: ", 
                     m_x + x_offset,
                     height_offset + height_per_row*row + text_offset
                  );

                  const int text_box_offset = 60;
                  const int inner_text_offset = 5;
                  d2d_setfillstylergba(ds, 0xFFFFFFFF);
                  d2d_fillrect(
                     ds,
                     m_x + x_offset + text_box_offset,
                     height_offset + height_per_row*row + 2,
                     prop_menu_data.width - x_offset*2 - text_box_offset,
                     height_per_row - 2
                  );
                  d2d_setfillstylergba(ds, 0x000000FF);
                  d2d_filltext(
                     ds,
                     prop_menu_data.text_buffer.text,
                     m_x + x_offset + text_box_offset + inner_text_offset,
                     height_offset + height_per_row*row + text_offset
                  );
               }
               break;
            }
            row += 1;
         }
      }
   }

   d2d_end_draw_sequence(ds);
}

__attribute__((export_name("mouseMoveHandler")))
void mouse_move_handler(int id, int x, int y, int button) {
   int m_x = (canvas_width - prop_menu_data.width)/2;
   int m_y = (canvas_height - prop_menu_data.height)/2;

   if (
      prop_menu_data.state != PROP_MENU_UNOPENED
      && (
         m_x < x && x < m_x + prop_menu_data.width
         && m_y < y && y < m_y + prop_menu_data.height
      )
   ) {
      return;
   }
   if (mouse_event_ids[MOUSE_EVENT_MOVE] != id) {
      prop_menu_data.state = PROP_MENU_UNOPENED;
   }
   if (mouse_event_ids[box_move_event_type] != id)
      return;
   if (box_move_event_type == MOUSE_EVENT_LEFT_CLICK && button != 0)
      return;
   square_x = x - SQUARE_WIDTH/2.0;
   square_y = y - SQUARE_HEIGHT/2.0;
   force_square_into_bounds();
}
__attribute__((export_name("keyEventHandler")))
void key_event_handler(int id, int key) {
   printf("pressed key: %d\n", key);
   if (prop_menu_data.state == PROP_MENU_UNOPENED)
      return;
   if (key == 27) { //escape
      prop_menu_data.state = PROP_MENU_UNOPENED;
      return;
   }
   if (prop_menu_data.state == PROP_MENU_GET)
      return;
   
   enum prop_menu_selected selected = prop_menu_data.accepted_types[prop_menu_data.selected_type];
   enum prop_menu_target target = prop_menu_data.target;

   struct text_fill_buffer* text_buffer = &prop_menu_data.text_buffer;
   struct text_fill_buffer* number_buffer = &prop_menu_data.number_buffer;
   switch (key) {

      case 8593: //up arrow
      {
         if (prop_menu_data.selected_type > 0) {
            prop_menu_data.selected_type--;
         }
      }
      break;

      case 8595: //down arrow
      {
         if (prop_menu_data.selected_type < prop_menu_data.accepted_types_len-1) {
            prop_menu_data.selected_type++;
         }
      }
      break;

      case 8: //backspace
      {
         char deleted;
         if (selected == PROP_MENU_SELECTED_STRING) {
            try_pop_from_text_fill_buffer(text_buffer, &deleted);
         } else if (selected == PROP_MENU_SELECTED_NUMBER) {
            if (try_pop_from_text_fill_buffer(number_buffer, &deleted)) {
               if (deleted == '.') {
                  prop_menu_data.number_buffer_has_dot = FALSE;        
               }
            }
         }
      }
      break;
      case 127: //delete
      {
         if (selected == PROP_MENU_SELECTED_STRING) {
            text_buffer->text[0] = '\0';
            text_buffer->length = 0;
         } else if (selected == PROP_MENU_SELECTED_NUMBER) {
            number_buffer->text[0] = '\0';
            number_buffer->length = 0;
            prop_menu_data.number_buffer_has_dot = FALSE;
         }
      }
      break;

      case 10: //enter
      {
         switch (selected) {
            case PROP_MENU_SELECTED_TRUE:
            case PROP_MENU_SELECTED_FALSE:
               if (target == PROP_MENU_TARGET_WIDGET) {
                  twr_window_menu_widget_set_bool(
                     prop_menu_data.widget, 
                     prop_menu_data.prop_name, 
                     selected == PROP_MENU_SELECTED_TRUE ? TRUE : FALSE
                  );
               } else if (target == PROP_MENU_TARGET_MENU) {
                  twr_window_menu_set_prop_boolean(
                     window_con,
                     prop_menu_data.prop_name,
                     selected == PROP_MENU_SELECTED_TRUE ? TRUE : FALSE
                  );
               }
            break;
            case PROP_MENU_SELECTED_UNDEFINED:
               assert(target == PROP_MENU_TARGET_WIDGET);
               twr_window_menu_widget_set_undefined(
                  prop_menu_data.widget,
                  prop_menu_data.prop_name
               );
            break;
            case PROP_MENU_SELECTED_STRING:
               if (target == PROP_MENU_TARGET_WIDGET) {
                  twr_window_menu_widget_set_string(
                     prop_menu_data.widget,
                     prop_menu_data.prop_name,
                     prop_menu_data.text_buffer.text
                  );
               } else if (target == PROP_MENU_TARGET_MENU) {
                  twr_window_menu_set_prop_string(
                     window_con,
                     prop_menu_data.prop_name,
                     prop_menu_data.text_buffer.text
                  );
               }
            break;
            case PROP_MENU_SELECTED_NUMBER:
            {
               assert(prop_menu_data.number_buffer.length > 0);
               double res = strtod(prop_menu_data.number_buffer.text, NULL);
               if (target == PROP_MENU_TARGET_WIDGET) {
                  twr_window_menu_widget_set_number(
                     prop_menu_data.widget,
                     prop_menu_data.prop_name,
                     res
                  );
               } else {
                  twr_window_menu_set_prop_number(
                     window_con,
                     prop_menu_data.prop_name,
                     res
                  );
               }
            }
            break;
            default:
            assert(FALSE);
         }
         prop_menu_data.state = PROP_MENU_UNOPENED;
      }
      break;

      case '-':
      if (selected == PROP_MENU_SELECTED_NUMBER) {
         if (number_buffer->length == 0) {
            append_to_text_fill_buffer(number_buffer, '-');
         }
         break; //only break if it was a number, otherwise propogates down to default
      }

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '9':
      if (selected == PROP_MENU_SELECTED_NUMBER) {
         append_to_text_fill_buffer(number_buffer, key);
         break;
      }

      case '.':
      if (selected == PROP_MENU_SELECTED_NUMBER) {
         if (!prop_menu_data.number_buffer_has_dot) {
            prop_menu_data.number_buffer_has_dot = TRUE;

            append_to_text_fill_buffer(number_buffer, key);
         }

         break;
      }
      
      default:
      if (selected == PROP_MENU_SELECTED_STRING) {
         if (key <= 0xFF && isprint(key))
            append_to_text_fill_buffer(text_buffer, key);
      }
      break;
   }
}