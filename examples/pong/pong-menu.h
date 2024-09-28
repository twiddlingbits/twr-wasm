// #ifndef PONG_MENU
// #define PONG_MENU
#include "canvas.h"
#include "pong.h"
#include "two-player-pong.h"
#include "extra.h"


struct MenuButton {
   long x, y;
   long w, h;
   const char* name;
   int id;
   bool selected, initialized;
   long text_x, text_y;
};

enum class MenuState {
   Menu,
   SinglePlayerPong,
   TwoPlayerPong
};
class Menu {
   public:
   Menu();
   void setBounds(long width, long height);

   void mouseMoveEvent(long x, long y);
   void mousePressEvent(long x, long y);
   void keyDownEvent(long keycode);
   void keyUpEvent(long keycode);
   void render(long delta);

   private:
   twrCanvas canvas;
   long width;
   long height;
   LinkedListRoot<MenuButton> buttons;
   MenuState state = MenuState::Menu;

   void addButton(long x, long y, long w, long h, const char* name, int id);
   void renderButtons();
   void tryButtonPress(long x, long y);
   void updateButtonSelections(long x, long y);

   Pong s_pong;
   TwoPlayerPong t_pong;
   
};

// #endif