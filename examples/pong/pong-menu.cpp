#include "pong-menu.h"
#include <stdio.h>
#include <stdlib.h>     /* malloc, free, rand */

template<typename T>
LinkedListRoot<T>::LinkedListRoot() {
   this->root = NULL;
   this->tail = NULL;
}

// template<typename T>
// LinkedListRoot<T>::~LinkedListRoot() {
//    while (this->root) {
//       LinkedList<T>* tmp = this->root->next;
//       free(this->root);
//       this->root = tmp;
//    }
//    this->root = NULL;
//    this->tail = NULL;
// }

template<typename T>
void LinkedListRoot<T>::addNode(T val) {
   LinkedList<T>* node = (LinkedList<T>*)malloc(sizeof(LinkedList<T>));
   node->next = NULL;
   node->val = val;
   if (!this->root) {
      this->root = node;
      this->tail = node;
   } else {
      this->tail->next = node;
      this->tail = node;
   }
}

Menu::Menu() {}

void Menu::setBounds(long width, long height) {
   this->width = width;
   this->height = height;

   #define NUM_BUTTONS 3
   const char* BUTTON_NAMES[NUM_BUTTONS] = {
      "Single Player Pong", "2 Player Pong (AI)", "2 Player Pong"
   };
   const int BUTTON_WIDTH = 400;
   const int BUTTON_HEIGHT = 60;
   const int BUTTON_SPACING = 40;
   int button_offset = (width - BUTTON_WIDTH)/2;
   int y_offset = (height - (BUTTON_HEIGHT)*NUM_BUTTONS - (BUTTON_SPACING)*(NUM_BUTTONS - 1))/2;

   for (int i = 0; i < NUM_BUTTONS; i++) {
      int y = y_offset + (BUTTON_SPACING+BUTTON_HEIGHT)*i;
      this->addButton(button_offset, y, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_NAMES[i], i);
   }
}

void Menu::mouseMoveEvent(long x, long y) {
   // printf("move: %ld, %ld\n", x, y);
   switch (state) {
      case MenuState::Menu:
         this->updateButtonSelections(x, y);
         break;
      
      default:
         break;
   }
   
}

void Menu::mousePressEvent(long x, long y) {
   // printf("press: %ld, %ld\n", x, y);
   switch (state) {
      case MenuState::Menu:
         this->tryButtonPress(x, y);
         break;
      
      default:
         break;
   }
}

void Menu::keyDownEvent(long keycode) {
   switch (state) {
      case MenuState::Menu:
         break;

      case MenuState::SinglePlayerPong:
         this->s_pong.keyDownEvent(keycode);
         break;
      
      case MenuState::TwoPlayerPong:
         this->t_pong.keyDownEvent(keycode);
         break;
      
      default:
         break;
   }
}

void Menu::keyUpEvent(long keycode) {
   switch (state) {
      case MenuState::Menu:
         break;
      
      case MenuState::SinglePlayerPong:
         this->s_pong.keyUpEvent(keycode);
         break;

      case MenuState::TwoPlayerPong:
         this->t_pong.keyUpEvent(keycode);
         break;
      
      default:
         break;
   }
}

void Menu::render(long delta) {
   switch (state) {
      case MenuState::Menu:
      {
         this->canvas.startDrawSequence();

         this->canvas.reset();
         this->canvas.setFillStyleRGB(0xA0A0A0);
         this->canvas.fillRect(0.0, 0.0, this->width, this->height);

         this->renderButtons();

         this->canvas.endDrawSequence();
      }
      break;

      case MenuState::SinglePlayerPong:
         this->s_pong.tick(delta);
         this->s_pong.render();
         break;
      
      case MenuState::TwoPlayerPong:
         this->t_pong.tick(delta);
         this->t_pong.render();
         break;

      default:
         break;
   }
}

void Menu::addButton(long x, long y, long w, long h, const char* name, int id) {
   MenuButton button = {
      .x = x,
      .y = y,
      .w = w,
      .h = h,
      .name = name,
      .id = id,
      .selected = false,
      .initialized = false,
   };

   this->buttons.addNode(button);
}

void Menu::renderButtons() {
   for (LinkedList<MenuButton>* node = this->buttons.root; node; node = node->next) {
      MenuButton* button = &(node->val);
      this->canvas.setFillStyleRGB(button->selected ? 0x007007 : 0x0000FF);
      this->canvas.fillRect(button->x, button->y, button->w, button->h);

      this->canvas.setFont("24px Serif");
      
      if (!button->initialized) {
         button->initialized = true;
         d2d_text_metrics text_metrics;
         this->canvas.measureText(button->name, &text_metrics);
         long width = text_metrics.width;
         long height = text_metrics.actualBoundingBoxAscent - text_metrics.actualBoundingBoxDescent;
         button->text_x = (button->w - width)/2;
         button->text_y = (button->h + height)/2;
         printf("%s: %ld, %ld; %ld, %ld\n", button->name, width, height, button->text_x, button->text_y);
      }
      this->canvas.setFillStyleRGB(0xFFFFFF);
      this->canvas.fillText(button->name, button->x + button->text_x, button->y + button->text_y);
   }
}

void Menu::updateButtonSelections(long x, long y) {
   for (LinkedList<MenuButton>* node = this->buttons.root; node; node = node->next) {
      MenuButton *button = &(node->val);
      button->selected = x >= button->x && x <= button->x+button->w
                        && y >= button->y && y <= button->y+button->h;
      
   }
}

const colorRGB_t s_pong_border_color = 0x2b8fbd;
const colorRGB_t s_pong_background_color = 0xFFFFFF;
const colorRGB_t s_pong_paddle_color = 0xFF0000;
const colorRGB_t s_pong_ball_color = 0x00FF00;

extern "C" {
   __attribute__((import_name("setElementText")))
   void set_element_text(const char* element_id, const char* text);
}
void Menu::tryButtonPress(long x, long y) {
   this->updateButtonSelections(x, y);
   for (LinkedList<MenuButton>* node = this->buttons.root; node; node = node->next) {
      MenuButton *button = &(node->val);
      if (button->selected) {
         switch (button->id) {
            case 0:
               this->state = MenuState::SinglePlayerPong;
               this->s_pong = Pong(600, 600, s_pong_border_color, s_pong_background_color, s_pong_paddle_color, s_pong_ball_color);
               set_element_text("control_text", "Move the paddle using a and d or the left and right arrow keys.");
            break;

            case 1:
               this->state = MenuState::TwoPlayerPong;
               this->t_pong = TwoPlayerPong(this->width, this->height, true);
               set_element_text("control_text", "Move the paddle using w and s or the up and down arrow keys.");
            break;

            case 2:
               this->state = MenuState::TwoPlayerPong;
               this->t_pong = TwoPlayerPong(this->width, this->height, false);
               set_element_text("control_text", "Move the left paddle using w and s. Move the right one with the up and down arrow keys.");
            break;

            default:
            break;
         }
         return;
      }
   }

   this->s_pong = Pong(width, height, s_pong_border_color, s_pong_background_color, s_pong_paddle_color, s_pong_ball_color);
}