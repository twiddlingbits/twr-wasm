
#include "twr-crt.h"
#include "twr-jsimports.h"

// Matches TS class twrWaitingCalls

void twr_sleep(int ms) {
    twrSleep(ms);  // blocking call implemented by twrWasModuleAsync
}

// ms since epoch
uint64_t twr_epoch_timems() {
	return (uint64_t)twrTimeEpoch();
}

