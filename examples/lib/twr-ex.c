#include "twr-library.h"
#include "twr-ex.h"


void ex_register_event_loop(void event_loop()) {
   lib_register_event_loop()
}

void ex_sleep(int ms) {
   singleShotTimer(ms, 0);
   twrWaitEvent("timeout");
}

/*
void ex_waitkey(int ms) {
   getKey(ms, 0);
   waitEvent("timeout");
}

*/
