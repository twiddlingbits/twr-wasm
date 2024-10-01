#include "extra.h"
#include <math.h>
#include <string.h>

#define M_PI 3.14159265358979323846

float* generate_square_wave(double frequency, double duration, long sample_rate) {
   long length = (long)ceil(duration * sample_rate);
   float* wave = (float*)malloc(sizeof(float) * length);
   for (long i = 0; i < length; i++) {
      wave[i] = cos(2*M_PI*frequency*(i/(float)sample_rate)) > 0 ? 1 : -1;
   }
   return wave;
}

long load_square_wave(double frequency, double duration, long sample_rate) {
   float* wave = generate_square_wave(frequency, duration, sample_rate);
   long node_id = twr_audio_from_float_pcm(1, sample_rate, wave, (long)ceil(duration * sample_rate));
   free(wave);
   return node_id;
}


CenteredText::CenteredText(double height, double width, double vertical_spacing) {
   this->height = height;
   this->width = width;
   this->vertical_spacing = vertical_spacing;
}

void CenteredText::addText(const char* text, const char* font, colorRGBA_t color, colorRGBA_t outline_color, double outline_radius) {
   CenteredTextObject text_object = {
      .text = strdup(text),
      .font = strdup(font),
      .color = color,
      .outline_color = outline_color,
      .outline_radius = outline_radius,
   };

   this->text_objects.addNode(text_object);
   this->changed = true;
}

void CenteredText::addText(const char* text, const char* font, unsigned long color) {
   this->addText(text, font, color, 0, 0);
}

void CenteredText::calculatePositions(twrCanvas& canvas) {
   double total_height = 0.0;
   d2d_text_metrics metrics;
   for (LinkedList<CenteredTextObject>* node = this->text_objects.root; node != NULL; node = node->next) {
      canvas.setFont(node->val.font);
      canvas.setFillStyleRGBA(node->val.color);
      canvas.measureText(node->val.text, &metrics);

      double height = metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent;

      total_height += height + vertical_spacing;

      node->val.x = (this->width - metrics.width)/2.0;
      node->val.y = height; //temporarily set current height to y
   }
   total_height -= vertical_spacing; //remove extra vertical spacing

   double prev_height = (this->height - total_height)/2.0;
   double height = prev_height;

   for (LinkedList<CenteredTextObject>* node = this->text_objects.root; node != NULL; node = node->next) {
      //add mesaured height and vertical spacing to height for next object
      height += node->val.y + vertical_spacing; 
      //set actual y position
      node->val.y = prev_height;
      //update prev_height
      prev_height = height;
   }
   this->changed = false;
}

void CenteredText::render(twrCanvas& canvas) {
   canvas.save();
   if (this->changed) {
      //update positions
      this->calculatePositions(canvas);
   }

   //ensure line strokes are setup properly
   canvas.setLineDash(0, (double*)NULL);
   canvas.setLineCap("square");
   canvas.setLineJoin("bevel");

   for (LinkedList<CenteredTextObject>* node = this->text_objects.root; node != NULL; node = node->next) {
      canvas.setFont(node->val.font);
      if (node->val.outline_radius > 0.0) {
         canvas.setStrokeStyleRGBA(node->val.outline_color);
         canvas.setLineWidth(node->val.outline_radius);

         canvas.strokeText(node->val.text, node->val.x, node->val.y);
      }
      canvas.setFillStyleRGBA(node->val.color);
      canvas.fillText(node->val.text, node->val.x, node->val.y);
   }

   canvas.restore();
}