
#include "twr-wasm.h"

// Matches TS class twrWaitingCalls

void twr_wasm_sleep(int ms) {
    twrSleep(ms);  // blocking call implemented by twrWasModuleAsync
}

unsigned long twr_wasm_time(unsigned long *time) {
    const unsigned long t=twrTime();  
    if (time) *time=t;
    return t;
}

