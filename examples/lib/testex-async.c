
#include <stdio.h>
#include "twr-ex.h"


void event_loop() {
   printf("event_loop entered\n");

}

twr_main() {

   printf("welcome to the example library test\n")

   printf("Calling singleShotKey\n")
   ex_register_eventloop(event_loop);
   ex_single_shot_key(1000, )
   printf("returned from singleShotKey");
   
   if (twr_is_modasync) {
      printf("going to sleep for two seconds\n");
      ex_sleep(2000);
      printf("woken up!\n");
   }


}

enum event_type {
   key=0,
   timeout
};

struct key_event {
   int key;
};

struct timout_event {

};

struct twr_event {
   enum event_type type;
   union {
      struct key_event key;
      struct timeout_event timeout;
   }
}

typedef struct twr_event twr_event_t;

   twr_event_t ev;

   while (1) {
      wait_event(NULL, &ev);

      printf("received event.  type=%d\n", ev.type);

      if (ev.type==key) printf("key=%d", ev.key);
      else if (ev.type==timeout) printf("timout");
      else printf ("error - unknown event type\n");
   }
