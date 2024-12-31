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

unsigned long box_color = 0xFF0000FF;
int box_border = 0;

struct twr_window_widget spawn_button;
int delete_button_callback;

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

   box_color_menu = twr_window_add_menu(window_con, "Box Options");
   test_two_menu = twr_window_add_menu(window_con, "test_two");

   struct twr_widget_button_constructor spawn_button_constructor = {
      .base = {
         .type = WINDOW_WIDGET_BUTTON,
         .width = -1,
         .height = 20
      },
      .text = "Spawn New Button",
   };
   spawn_button = twr_window_menu_add_widget(&test_two_menu, &spawn_button_constructor.base);
   
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

   twr_window_menu_add_widget(&test_two_menu, &seperator_cons.base);
   

   // struct twr_window_menu radio_menu_header = twr_window_add_menu(window_con, "Radio_Menu");
   struct twr_widget_sub_menu_constructor sub_menu = {
      .base = {
         .type = WINDOW_WIDGET_SUB_MENU,
         .width = 30,
         .height = 20,
      },
      .button_text = "Box Color",
      
      .min_child_height = 10,
      .minimum_menu_height = 10,
      .minimum_menu_width = 10,
   };
   struct twr_window_widget box_color_sub_menu = twr_window_menu_add_widget(&box_color_menu, &sub_menu.base);

   struct twr_widget_radio_menu_constructor radio_menu_constructor = {
      .base = {
         .type = WINDOW_WIDGET_RADIO_MENU,
         .width = -1,
         .height = -1,
      },
      .minimum_height = 10,
      .minimum_width = 10,
      .option_height = 20,
      .selected_symbol = "*",
   };
   struct twr_window_widget radio_menu = twr_window_menu_add_widget(&box_color_sub_menu, &radio_menu_constructor.base);
   twr_window_menu_radio_menu_add_option(&radio_menu, "Red");
   twr_window_menu_radio_menu_add_option(&radio_menu, "Blue");
   twr_window_menu_radio_menu_add_option(&radio_menu, "Magenta");
   twr_window_menu_radio_menu_add_option(&radio_menu, "Yellow");
   twr_window_menu_radio_menu_add_option(&radio_menu, "Cyan");
   twr_window_menu_radio_menu_add_option(&radio_menu, "Teal");

   int box_color_event = twr_register_callback("boxColorChanged");
   twr_window_menu_widget_add_callback(&radio_menu, box_color_event, (void*)0);

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

   struct twr_window_widget check_box = twr_window_menu_add_widget(&box_color_menu, &check_box_constructor.base);
   int check_box_event = twr_register_callback("boxBorderChanged");
   twr_window_menu_widget_add_callback(&check_box, check_box_event, (void*)0);
}

__attribute__((export_name("boxBorderChanged")))
void box_border_changed(int event_id, void* _, int new_state) {
   printf("new box border update! %d\n", new_state);
   box_border = new_state;
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

   twr_window_menu_widget_add_callback(&button, delete_button_callback, (void*)heap_button);
}
__attribute__((export_name("deleteButtonPressed")))
void delete_button_pressed(int event_id, struct twr_window_widget* button) {
   twr_window_menu_delete_widget(button);
   free(button);
}
__attribute__((export_name("boxColorChanged")))
void box_color_changed(int event_id, void* extra, char* opt) {
   if (strcmp(opt, "Red") == 0) {
      box_color = 0xFF0000FF;
   } else if (strcmp(opt, "Blue") == 0) {
      box_color = 0x0000FFFF;
   } else if (strcmp(opt, "Magenta") == 0) {
      box_color = 0xFF00FFFF;
   } else if (strcmp(opt, "Yellow") == 0) {
      box_color = 0xFFFF00FF;
   } else if (strcmp(opt, "Cyan") == 0) {
      box_color = 0x00FFFFFF;
   } else if (strcmp(opt, "Teal") == 0) {
      box_color = 0x008080FF;
   }
   free(opt);
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

   d2d_end_draw_sequence(ds);
}

__attribute__((export_name("mouseMoveHandler")))
void mouse_move_handler(int id, int x, int y) {
   square_x = x - SQUARE_WIDTH/2.0;
   square_y = y - SQUARE_HEIGHT/2.0;
}