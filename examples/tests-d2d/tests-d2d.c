#include <stddef.h>
#include "twr-draw2d.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

unsigned long crc32(char* str, unsigned long len) {
   const long table_len = 256;
   unsigned long crc_table[table_len];
   unsigned long c;
   for (unsigned long n = 0; n < table_len; n++) {
      c = n;
      for (unsigned long k = 0; k < 8; k++) {
         c = (c & 1) ? (0xEDB88320 ^ (c >> 1)) : (c >> 1);
      }
      crc_table[n] = c;
   }

   unsigned long crc = (unsigned long)((long)0 ^ (-1));
   
   for (char* str_pos = str; str_pos < str+len; str_pos++) {
      crc = (crc >> 8) ^ crc_table[(crc ^ *str_pos) & 0xFF];
   }

   return (unsigned long)((long)crc ^ (-1)) >> 0;
}

unsigned short fletcher16(char* str) {
   unsigned short sum1 = 0xFF;
   unsigned short sum2 = 0xFF;

   for (char* str_ptr = str; *str_ptr != '\0'; str_ptr++) {
      sum1 = (sum1 + *str_ptr) % 255;
      sum2 = (sum2 + sum1) % 255;
   }

   return (sum2 << 8) | sum1;
}

void to_hex_string(unsigned long num, char* hex) {
   for (unsigned long i = 0; i < 8; i++) {
      int seg = (int)((num >> i*4) & 0xF);
      hex[7-i] = (char)(seg <= 9 ? '0'+seg : 'A'+seg-10);
   }
   hex[8] = '\0';
}



void test_hash(char* test, unsigned long expected_hash, unsigned long calc_hash) {
   if (calc_hash == expected_hash) {
      printf("%s test was successful!\n", test);
   } else {
      char canvas_hex[9];
      to_hex_string(calc_hash, canvas_hex);
      char expected_hex[9];
      to_hex_string(expected_hash, expected_hex);
      printf("%s test failed! Expected 0x%s got 0x%s\n", test, expected_hex, canvas_hex);
   }
}
#define width 600
#define height 600
#define mem_size width*height*4
char mem[mem_size];
void test_img_hash(struct d2d_draw_seq* ds, char* test, unsigned long hash) {

   d2d_getimagedata(ds, 1, 0, 0, width, height);
   d2d_imagedatatoc(ds, 1, (void*)mem, mem_size);
   d2d_releaseid(ds, 1);
   unsigned long canvas_hash = crc32(mem, mem_size);

   test_hash(test, hash, canvas_hash);
}

void test() {
   struct d2d_draw_seq* ds = d2d_start_draw_sequence(1000);

   test_img_hash(ds, "EmptyCanvas", 0xEBF5A8C4);

   d2d_fillrect(ds, 10.0, 10.0, 300.0, 300.0);
   test_img_hash(ds, "Rect", 0xDF03FF9D);

   d2d_reset(ds);
   test_img_hash(ds, "Reset", 0xEBF5A8C4);

   d2d_strokerect(ds, 10.0, 10.0, 300.0, 300.0);
   test_img_hash(ds, "StrokeRect", 0x0EE9C868);

   d2d_reset(ds);
   d2d_filltext(ds, "Test Text", 50.0, 50.0);
   test_img_hash(ds, "FillText", 0x2CDB5653);

   d2d_reset(ds);
   d2d_fillcodepoint(ds, 65, 50.0, 50.0);
   test_img_hash(ds, "FillCodePoint", 0x08A03E90);

   d2d_reset(ds);
   d2d_stroketext(ds, "Test Text", 50.0, 50.0);
   test_img_hash(ds, "StrokeText", 0x78565C1A);

   d2d_reset(ds);
   struct d2d_text_metrics metrics;
   d2d_measuretext(ds, "Test Text", &metrics);
   test_hash("TextMetrics", 0x0EC6A4C3, crc32((char*)&metrics, sizeof(struct d2d_text_metrics)));

   d2d_reset(ds);
   d2d_setlinewidth(ds, 10.0);
   d2d_strokerect(ds, 50.0, 50.0, 500.0, 500.0);
   test_img_hash(ds, "SetLineWidth", 0x55D8096E);

   d2d_reset(ds);
   d2d_setlinewidth(ds, 50.0);
   d2d_save(ds);
   d2d_setlinewidth(ds, 10.0);
   d2d_restore(ds);
   d2d_strokerect(ds, 50.0, 50.0, 500.0, 500.0);
   test_img_hash(ds, "SaveAndRestore", 0x4F93735F);

   d2d_reset(ds);
   d2d_setstrokestylergba(ds, 0xFF00FF30);
   d2d_strokerect(ds, 50.0, 50.0, 500.0, 500.0);
   test_img_hash(ds, "SetStrokeStyleRGBA", 0x105BB7BC);

   // d2d_reset(ds);
   // d2d_setfillstylergba(ds, 0x)
   d2d_end_draw_sequence(ds);
}