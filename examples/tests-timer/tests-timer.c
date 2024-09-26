#include <stdio.h>
#include <twr-crt.h>

int t1_count=0;
int t2_count=0;
int t2_id;

// timer1 event callback (called once)
__attribute__((export_name("on_timer1")))
void on_timer1(int event_id) {
   t1_count++;
   printf("timer callback 1 entered (event id=%d, count=%d)\n", event_id, t1_count);
}

// timer2 event callback (called multiple times)
__attribute__((export_name("on_timer2")))
void on_timer2(int event_id) {
   t2_count++;
   printf("timer callback 2 entered (event id=%d, count=%d)\n", event_id, t2_count);

   if (t2_count==5) {
      twr_timer_cancel(t2_id);
      if (t1_count!=1) 
         printf("twr_timer_single_shot FAIL!!\n");
      printf("timer test complete\n");
   }
}

int tests_timer(int is_async) {

   printf("starting timer tests.\n");

   int t1_eventid=twr_register_callback("on_timer1");
   twr_timer_single_shot(2000, t1_eventid);

   int t2_eventid=twr_register_callback("on_timer2");
   t2_id=twr_timer_repeat(500, t2_eventid);

   if (is_async) {
      printf("going to sleep...\n");
      twr_sleep(1000);
      printf("awake from sleep!\n");
      }

   if (t2_count!=0 && t1_count!=0) {
      printf("FAIL!!  t1_count is %d, t2 %d\n", t1_count, t2_count);
   }

   return 0;
}