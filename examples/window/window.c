#include "twr-window.h"
#include "twr-draw2d.h"
#include "twr-crt.h"
#include "stdlib.h"

twr_ioconsole_t* window_con = NULL;
twr_ioconsole_t* canvas_con = NULL;

long canvas_width = 0;
long canvas_height = 0;


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

   d2d_setfillstylergba(ds, 0xFF0000FF);
   d2d_fillrect(ds, square_x, square_y, SQUARE_WIDTH, SQUARE_HEIGHT);

   d2d_end_draw_sequence(ds);
}

__attribute__((export_name("mouseMoveHandler")))
void mouse_move_handler(int id, int x, int y) {
   square_x = x - SQUARE_WIDTH/2.0;
   square_y = y - SQUARE_HEIGHT/2.0;
}