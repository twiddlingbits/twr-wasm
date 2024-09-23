#include <stdio.h>
#include <twr-crt.h>

int t1_count=0;
int t2_count=0;
int t2_id;

// timer event callback (called once)
__attribute__((export_name("on_timer1")))
void on_timer1(int event_id) {
   t1_count++;
   printf("timer callback 1 entered (event id=%d, count=%d)\n", event_id, t1_count);

   if (t2_count!=5) 
      printf("twr_timer_repeat FAIL!!\n");
   else
      printf("test run complete\n");
}

// timer event callback (called multiple times by different timers)
__attribute__((export_name("on_timer2")))
void on_timer2(int event_id) {
   t2_count++;
   printf("timer callback 2 entered (event id=%d, count=%d)\n", event_id, t2_count);

   if (t2_count==5) {
      twr_timer_cancel(t2_id);
      if (t1_count!=0) 
         printf("twr_timer_single_shot FAIL!!\n");
   }
}

int tests_timer(int is_async) {

   printf("starting timer tests.\n");

   int t2_eventid=twr_register_callback("on_timer2");
   t2_id=twr_timer_repeat(500, t2_eventid);
   
   int t1_eventid=twr_register_callback("on_timer1");

   if (is_async) {
      printf("going to sleep...\n");
      twr_sleep(1000);
      printf("awake from sleep!\n");

      if (t2_count!=2) {
         printf("FAIL!!  t2_count is %d\n", t2_count);
      }

      twr_timer_single_shot(2000, t1_eventid);
   }

   else {
      twr_timer_single_shot(4000, t1_eventid);
   }

   return 0;
}