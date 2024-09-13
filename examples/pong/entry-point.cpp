#include "pong-menu.h"

// #define CANVAS_WIDTH 600
// #define CANVAS_HEIGHT 600
Menu menu;

static int MOUSE_MOVE_EVENT_ID = -1;
static int MOUSE_PRESS_EVENT_ID = -1;
static int ANIMATION_LOOP_EVENT_ID = -1;
static int KEY_DOWN_EVENT_ID = -1;
static int KEY_UP_EVENT_ID = -1;
extern "C" {
   __attribute__((import_name("twr_register_callback")))
   int twr_register_callback(const char* func_name);

   __attribute__((import_name("registerKeyUpEvent")))
   void register_key_up_event(int event_id);

   __attribute__((import_name("registerKeyDownEvent")))
   void register_key_down_event(int event_id);

   __attribute__((import_name("registerAnimationLoop")))
   void register_animation_loop(int event_id);

   __attribute__((import_name("registerMouseMoveEvent")))
   void register_mouse_move_event(int event_id, const char* element_id, bool relative);

   __attribute__((import_name("registerMousePressEvent")))
   void register_mouse_press_event(int event_id, const char* element_id, bool relative);



   __attribute__((export_name("initMenu")))
   void init_menu() {
      MOUSE_MOVE_EVENT_ID = twr_register_callback("menuMouseMoveCallback");
      register_mouse_move_event(MOUSE_MOVE_EVENT_ID, "twr_d2dcanvas", true);

      MOUSE_PRESS_EVENT_ID = twr_register_callback("menuMousePressCallback");
      register_mouse_press_event(MOUSE_PRESS_EVENT_ID, "twr_d2dcanvas", true);

      ANIMATION_LOOP_EVENT_ID = twr_register_callback("menuAnimationLoopCallback");
      register_animation_loop(ANIMATION_LOOP_EVENT_ID);

      KEY_DOWN_EVENT_ID = twr_register_callback("menuKeyDownCallback");
      register_key_down_event(KEY_DOWN_EVENT_ID);

      KEY_UP_EVENT_ID = twr_register_callback("menuKeyUpCallback");
      register_key_up_event(KEY_UP_EVENT_ID);

      menu.setBounds(d2d_get_canvas_prop("canvasWidth"), d2d_get_canvas_prop("canvasHeight"));
   }

   __attribute__((export_name("menuMouseMoveCallback")))
   void mouse_move_callback(int event_id, long x, long y) {
      menu.mouseMoveEvent(x, y);
   }

   __attribute__((export_name("menuMousePressCallback")))
   void mouse_press_callback(int event_id, long x, long y, long button) {
      menu.mousePressEvent(x, y);
   }

   __attribute__((export_name("menuAnimationLoopCallback")))
   void menu_animation_loop_callback(int event_id, long delta) {
      menu.render(delta);
   }

   __attribute__((export_name("menuKeyDownCallback")))
   void menu_key_down_callback(int event_id, long keycode) {
      menu.keyDownEvent(keycode);
   }

   __attribute__((export_name("menuKeyUpCallback")))
   void menu_key_up_callback(int event_id, long keycode) {
      menu.keyUpEvent(keycode);
   }

}