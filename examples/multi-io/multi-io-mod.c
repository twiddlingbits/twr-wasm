#include <stdio.h>
#include <stdlib.h>
#include "twr-crt.h"
#include "twr-draw2d.h"

void multi() {

   // these are all being directed to the browser debug console in this example
   printf("Welcome multi-io-mod!\n");

   if (twr_get_console("this is not a real console name")!=NULL) {
      twr_conlog("Error! console name found");
      abort();
   }

   twr_ioconsole_t * stream1=twr_get_console("stream1");
   // Since we know "stream1" was created in index.html, this check is not needed
   // Plus, if we make an error, there will be an exception when we try and use the NULL console
   // but this check is here since this code is also used to test twr-wasm APIs
   if (stream1==NULL) {
      twr_conlog("Error! stream1 not found");
      abort();
   }

   twr_ioconsole_t * stream2=twr_get_console("stream2");
   if (stream2==NULL) {
      twr_conlog("Error! stream2 not found");
      abort();
   }

   fprintf(stream1, "Hello Stream One from multi-io-mod!\n");
   fprintf(stream2, "Hello Stream Two from multi-io-mod\n");

   twr_ioconsole_t * draw1=twr_get_console("draw1");
   if (draw1==NULL) {
      twr_conlog("Error! draw1 not found");
      abort();
   }

   twr_ioconsole_t * draw2=twr_get_console("draw2");
   if (draw2==NULL) {
      twr_conlog("Error! draw2 not found");
      abort();
   }

   struct d2d_draw_seq* ds=d2d_start_draw_sequence_with_con(100, draw1);
   d2d_setfillstyle(ds, "lightblue");
   d2d_fillrect(ds, 110, 10, 100, 100);
   d2d_end_draw_sequence(ds);

   ds=d2d_start_draw_sequence_with_con(100, draw2);
   d2d_setfillstyle(ds, "#FF6666");  // lightred
   d2d_fillrect(ds, 110, 10, 100, 100);
   d2d_end_draw_sequence(ds);   
}