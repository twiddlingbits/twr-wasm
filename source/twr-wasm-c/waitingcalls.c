
#include "twr-wasm.h"

// Matches TS class twrWaitingCalls

void twr_wasm_sleep(int ms) {
    twrSleep(ms);  // blocking call implemented by twrWasModuleAsync
}

