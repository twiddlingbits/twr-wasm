
#include <stdio.h>
#include <stdlib.h>
#include "twr-library.h"
#include "twr-ex.h"

// twrWasmModule example


__attribute__((export_name("on_key")))
void on_key(int event_id, int key_code) {
   printf("key code: %d\n", key_code);
}

__attribute__((export_name("on_timer1")))
void on_timer1(int event_id) {
   printf("timer 1 callback entered (event id=%d) !\n", event_id);

   printf("press keys now\n");
   int key=twr_register_callback("on_key");

   ex_listen_key_events(key);
}

__attribute__((export_name("on_timer2")))
void on_timer2(int event_id) {
   printf("timer 2 callback entered (event id=%d)\n", event_id);
}

__attribute__((export_name("twr_main")))
void twr_main() {

   printf("welcome to the example library using twrWasmModule\n");

   unsigned long ms=ex_get_epoch();
   printf ("ms since the epoch is %lu\n", ms);

   char* two_str=ex_append_two_strings("AAA-","BBB");
   printf ("two strings appended: %s\n", two_str);;
   free(two_str);

   int timer1=twr_register_callback("on_timer1");

   // note these are all the same callback, but different id
   int timer2=twr_register_callback("on_timer2");
   int timer3=twr_register_callback("on_timer2");
   int timer4=twr_register_callback("on_timer2");

   ex_single_shot_timer(2000, timer1);
   ex_single_shot_timer(500, timer2);
   ex_single_shot_timer(1000, timer3);
   ex_single_shot_timer(1500, timer4);
}
