#include "twr-window.h"
#include "twr-draw2d.h"
#include "twr-crt.h"
#include "stdlib.h"
#include "string.h"

twr_ioconsole_t* window_con = NULL;
twr_ioconsole_t* canvas_con = NULL;

long canvas_width = 0;
long canvas_height = 0;


struct twr_window_widget box_color_menu;
struct twr_window_widget test_two_menu;
struct twr_window_widget extra_menu;
struct twr_window_widget prop_menu;
unsigned long box_color = 0xFF0000FF;
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
__attribute__((export_name("init")))
void init() {
   if (window_con)
      free(window_con);
   
   if (canvas_con)
      free(canvas_con);
   
   window_con = twr_get_console("window");
   canvas_con = twr_window_get_app_canvas(window_con);

   twr_set_std2d_con(canvas_con);

   canvas_width = io_get_prop(canvas_con, "canvasWidth");
   canvas_height = io_get_prop(canvas_con, "canvasHeight");

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



   box_color_menu = twr_window_add_menu(window_con, "Box Options");
   test_two_menu = twr_window_add_menu(window_con, "test_two");
   extra_menu = twr_window_add_menu(window_con, "extra");

   setup_box_options_menu(&box_color_menu);
   setup_test_two_menu(&test_two_menu);
   setup_extra_menu(&extra_menu);

   long prop_len;
   struct twr_widget_prop_details* props = twr_window_menu_widget_list_props(&box_color_menu, &prop_len);
   printf("C alloc: %d\nC Length: %ld\n", (int)props, prop_len);
   for (long i = 0; i < prop_len; i++) {
      printf("prop list: %s\n", props[i].name);
   }
   free(props);
   
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
      struct twr_widget_radio_item_constructor radio_item_constructor = {
         .base = {
            .type = WINDOW_WIDGET_RADIO_ITEM,
            .width = -1,
            .height = 10,
         },
         .text = BOX_COLOR_NAMES[i],
      };
      struct twr_window_widget radioItem = twr_window_menu_add_widget(box_color_sub_menu, &radio_item_constructor.base);
      twr_window_menu_widget_add_callback(&radioItem, box_color_event, (void*)(BOX_COLOR_VALUES[i]));

      if (i == 0) {
         root_radio_item = radioItem;
      } else {
         twr_window_menu_radio_item_merge(&root_radio_item, &radioItem);
      }
   }
}
void setup_box_options_menu(struct twr_window_widget* box_options_menu) {
   struct twr_widget_sub_menu_constructor sub_menu = {
      .base = {
         .type = WINDOW_WIDGET_SUB_MENU,
         .width = 20,
         .height = -1,
      },
      .button_text = "Box Color",
      
      .min_child_height = -1,
      .minimum_menu_height = -1,
      .minimum_menu_width = -1,
      
   };
   struct twr_window_widget box_color_sub_menu = twr_window_menu_add_widget(box_options_menu, &sub_menu.base);
   setup_box_color_sub_menu(&box_color_sub_menu);

   struct twr_widget_check_box_constructor check_box_constructor = {
      .base = {
         .type = WINDOW_WIDGET_CHECK_BOX,
         .width = -1,
         .height = 20
      },
      .checked_symbol = "[*]",
      .unchecked_symbol = "[  ]",
      .text = "Box Outline",
   };

   struct twr_window_widget check_box = twr_window_menu_add_widget(box_options_menu, &check_box_constructor.base);
   int check_box_event = twr_register_callback("boxBorderChanged");
   twr_window_menu_widget_add_callback(&check_box, check_box_event, (void*)0);
}


__attribute__((export_name("spawnButtonPressed")))
void spawn_button_pressed(int event_id, void* ptr) {
   struct twr_widget_button_constructor new_button_con = {
      .base = {
         .width = -1,
         .height = 20,
      },
      .text = "Delete!",
   };
   struct twr_window_widget button = twr_window_menu_add_widget(&test_two_menu, &new_button_con.base);

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
   struct twr_widget_button_constructor spawn_button_constructor = {
      .base = {
         .type = WINDOW_WIDGET_BUTTON,
         .width = -1,
         .height = 20
      },
      .text = "Spawn New Button",
   };
   spawn_button = twr_window_menu_add_widget(test_two_menu, &spawn_button_constructor.base);
   
   int spawn_button_callback = twr_register_callback("spawnButtonPressed");
   twr_window_menu_widget_add_callback(&spawn_button, spawn_button_callback, (void*)0);
   delete_button_callback = twr_register_callback("deleteButtonPressed");

   struct twr_widget_seperator_constructor seperator_cons = {
      .base = {
         .type = WINDOW_WIDGET_SEPERATOR,
         .width = -1,
         .height = 10
      },
      .seperator_text = "-",
      .seperator_font = NULL,
   };

   twr_window_menu_add_widget(test_two_menu, &seperator_cons.base);
}

void set_widget_visibility(struct twr_window_widget* widget, int visibility) {
   twr_window_menu_widget_set_bool(widget, "isVisible", visibility);
}

void setup_extra_box_movement_sub_menu(struct twr_window_widget* box_movement_menu) {
   struct DynamicWidgetArray* extra_box_movement_items = (struct DynamicWidgetArray*)malloc(sizeof(struct DynamicWidgetArray));
   extra_box_movement_items->len = 4;
   extra_box_movement_items->arr = (struct twr_window_widget*)malloc(sizeof(struct twr_window_widget) * extra_box_movement_items->len);

   struct twr_widget_check_box_constructor extra_box_movement_show_box_cons = {
      .base = {
         .type = WINDOW_WIDGET_CHECK_BOX,
         .width = -1,
         .height = 20
      },
      .checked_symbol = "[*]",
      .unchecked_symbol = "[  ]",
      .text = "Show"
   };
   struct twr_window_widget extra_box_movement_show_box = twr_window_menu_add_widget(box_movement_menu, &extra_box_movement_show_box_cons.base);
   
   struct twr_widget_seperator_constructor seperator_cons = {
      .base = {
         .type = WINDOW_WIDGET_SEPERATOR,
         .width = -1,
         .height = 10
      },
      .seperator_text = "-",
      .seperator_font = NULL,
   };

   extra_box_movement_items->arr[0] = twr_window_menu_add_widget(box_movement_menu, &seperator_cons.base);

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
      struct twr_widget_radio_item_constructor radio_item_cons = {
         .base = {
            .type = WINDOW_WIDGET_RADIO_ITEM,
            .height = 10,
            .width = -1
         },
         .text = MOUSE_MOVE_METHOD_NAMES[i]
      };
      struct twr_window_widget radio_item = twr_window_menu_add_widget(box_movement_menu, &radio_item_cons.base);
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
   struct twr_widget_check_box_constructor extra_checkbox_constructor = {
      .base = {
         .type = WINDOW_WIDGET_CHECK_BOX,
         .width = -1,
         .height = 20,
      },
      .checked_symbol = "[*]",
      .unchecked_symbol = "[  ]",
      .text = "Show Extra Options"
   };
   struct twr_window_widget extra_check_box = twr_window_menu_add_widget(extra_menu, &extra_checkbox_constructor.base);
   int extra_checkbox_event_id = twr_register_callback("extraCheckBoxCallback");

   struct DynamicWidgetArray* extra_widget_array = (struct DynamicWidgetArray*)malloc(sizeof(struct DynamicWidgetArray));
   extra_widget_array->len = 4;
   extra_widget_array->arr = (struct twr_window_widget*)malloc(sizeof(struct twr_window_widget) * extra_widget_array->len);

   struct twr_widget_seperator_constructor seperator_cons = {
      .base = {
         .type = WINDOW_WIDGET_SEPERATOR,
         .width = -1,
         .height = 10
      },
      .seperator_text = "-",
      .seperator_font = NULL,
   };
   extra_widget_array->arr[0] = twr_window_menu_add_widget(extra_menu, &seperator_cons.base);

   struct twr_widget_check_box_constructor extra_center_dot_checkbox_cons = {
      .base = {
         .type = WINDOW_WIDGET_CHECK_BOX,
         .width = -1,
         .height = 20,
      },
      .checked_symbol = "[*]",
      .unchecked_symbol ="[  ]",
      .text = "Centered Dot"
   };
   struct twr_window_widget extra_center_dot_checkbox = twr_window_menu_add_widget(extra_menu, &extra_center_dot_checkbox_cons.base);
   int extra_center_dot_event_id = twr_register_callback("extraCenterDotCallback");
   twr_window_menu_widget_add_callback(&extra_center_dot_checkbox, extra_center_dot_event_id, (void*)0);
   extra_widget_array->arr[1] = extra_center_dot_checkbox;

   struct twr_widget_button_constructor randomize_center_dot_color_cons = {
      .base = {
         .type = WINDOW_WIDGET_BUTTON,
         .width = -1,
         .height = 20,
      },
      .text = "Randomize Center Dot Color"
   };
   struct twr_window_widget randomize_center_dot_color = twr_window_menu_add_widget(extra_menu, &randomize_center_dot_color_cons.base);
   int randomize_center_dot_color_event_id = twr_register_callback("randomizeCenterDotColorCallback");
   twr_window_menu_widget_add_callback(&randomize_center_dot_color, randomize_center_dot_color_event_id, (void*)0);
   extra_widget_array->arr[2] = randomize_center_dot_color;

   struct twr_widget_sub_menu_constructor extra_box_movement_menu_cons = {
      .base = {
         .type = WINDOW_WIDGET_SUB_MENU,
         .height = 20,
         .width = -1,
      },
      .min_child_height = -1,
      .minimum_menu_height = -1,
      .minimum_menu_width = -1,
      .button_text = "Box Movement"
   };
   struct twr_window_widget extra_box_movement_menu = twr_window_menu_add_widget(extra_menu, &extra_box_movement_menu_cons.base);
   setup_extra_box_movement_sub_menu(&extra_box_movement_menu);
   extra_widget_array->arr[3] = extra_box_movement_menu;

   twr_window_menu_widget_add_callback(&extra_check_box, extra_checkbox_event_id, (void*)extra_widget_array);

   for (int i = 0; i < extra_widget_array->len; i++) {
      set_widget_visibility(&extra_widget_array->arr[i], 0);
   }
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


int square_x = 75;
int square_y = 75;
int SQUARE_WIDTH = 50;
int SQUARE_HEIGHT = 50;

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

   d2d_end_draw_sequence(ds);
}

__attribute__((export_name("mouseMoveHandler")))
void mouse_move_handler(int id, int x, int y, int button) {
   if (mouse_event_ids[box_move_event_type] != id)
      return;
   if (box_move_event_type == MOUSE_EVENT_LEFT_CLICK && button != 0)
      return;
   square_x = x - SQUARE_WIDTH/2.0;
   square_y = y - SQUARE_HEIGHT/2.0;
}