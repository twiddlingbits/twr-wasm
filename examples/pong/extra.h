#ifndef __EXTRA_H__
#define __EXTRA_H__

#include "twr-audio.h"
#include "canvas.h"
#include <stdlib.h>

float* generate_square_wave(double frequency, double duration, long sample_rate);
long load_square_wave(double frequency, double duration, long sample_rate);

template<typename T>
struct LinkedList {
   T val;
   LinkedList* next;
};

template<typename T>
class LinkedListRoot {
   public:
   LinkedList<T>* root = NULL;
   LinkedListRoot();
   ~LinkedListRoot();
   void addNode(T val);

   private:
   LinkedList<T>* tail = NULL;

};
template<typename T>
LinkedListRoot<T>::LinkedListRoot() {
   this->root = NULL;
   this->tail = NULL;
}

template<typename T>
LinkedListRoot<T>::~LinkedListRoot() {
   while (this->root) {
      LinkedList<T>* tmp = this->root->next;
      free(this->root);
      this->root = tmp;
   }
   this->root = NULL;
   this->tail = NULL;
}

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


struct CenteredTextObject {
   char* text;
   char* font;
   unsigned long color;
   unsigned long outline_color;

   double outline_radius;
   double x, y;
};

class CenteredText {
   public:
   CenteredText(double height, double width, double vertical_spacing);

   void addText(const char* text, const char* font, unsigned long color, unsigned long outline_color, double outline_radius);
   void addText(const char* text, const char* font, unsigned long color);

   void render(twrCanvas& canvas);

   private:
   bool changed = true;
   double height;
   double width;
   double vertical_spacing;
   
   void calculatePositions(twrCanvas& canvas);

   LinkedListRoot<CenteredTextObject> text_objects;
};

#endif