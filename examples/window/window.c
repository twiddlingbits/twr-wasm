#include "twr-window.h"
#include "twr-draw2d.h"
#include "twr-crt.h"
#include "stdlib.h"

twr_ioconsole_t* window_con = NULL;
twr_ioconsole_t* canvas_con = NULL;

long canvas_width = 0;
long canvas_height = 0;


struct twr_window_widget red_box_button;
struct twr_window_widget blue_box_button;
unsigned long box_color = 0xFF0000FF;

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

   struct twr_window_menu box_color_menu = twr_window_add_menu(window_con, "Box Color");
   struct twr_window_menu test_two_menu = twr_window_add_menu(window_con, "test_two");

   struct twr_widget_button_constructor red_box_button_cons = {
      .base = {
         .type = WINDOW_WIDGET_BUTTON,
         .x = 0,
         .y = 0,
         .width = -1,
         .height = 20
      },
      .text = "Red",
      .text_font = "14px Seriph",
      .text_color = NULL,
      .button_color = NULL,
      .selected_button_color = NULL
   };
   red_box_button = twr_window_menu_add_widget(&box_color_menu, &red_box_button_cons.base);
   
   struct twr_widget_seperator_constructor seperator_cons = {
      .base = {
         .type = WINDOW_WIDGET_SEPERATOR,
         .x = 0,
         .y = 0,
         .width = -1,
         .height = 10
      },
      .seperator_text = "-",
      .seperator_font = NULL,
      .seperator_color = NULL,
   };
   struct twr_window_widget seperator1 = twr_window_menu_add_widget(&box_color_menu, &seperator_cons.base);

   struct twr_widget_button_constructor blue_box_button_cons = {
      .base = {
         .type = WINDOW_WIDGET_BUTTON,
         .x = 0,
         .y = 0,
         .width = -1,
         .height = 20
      },
      .text = "Blue",
      .text_font = "14px Seriph",
      .text_color = NULL,
      .button_color = NULL,
      .selected_button_color = NULL
   };
   blue_box_button = twr_window_menu_add_widget(&box_color_menu, &blue_box_button_cons.base);

   int button_callback = twr_register_callback("buttonPressed");
   twr_window_menu_button_add_callback(&red_box_button, button_callback, (void*)(&red_box_button));
   twr_window_menu_button_add_callback(&blue_box_button, button_callback, (void*)(&blue_box_button));
}

__attribute__((export_name("buttonPressed")))
void button_pressed(int event_id, struct twr_window_widget* button) {
   if (button->widget_id == red_box_button.widget_id) {
      box_color = 0xFF0000FF;
   } else if (button->widget_id == blue_box_button.widget_id) {
      box_color = 0x0000FFFF;
   }
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

   d2d_end_draw_sequence(ds);
}

__attribute__((export_name("mouseMoveHandler")))
void mouse_move_handler(int id, int x, int y) {
   square_x = x - SQUARE_WIDTH/2.0;
   square_y = y - SQUARE_HEIGHT/2.0;
}