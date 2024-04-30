#include <time.h>
#include "twr-crt.h"  //twr_epoch_timems

// return seconds since epoch
unsigned long time(unsigned long *time) {
    const uint64_t ms=twr_epoch_timems();  
	 const uint64_t sec=ms/1000;
    if (time) *time=(unsigned long)sec;
    return (unsigned long)sec;
}

// return seconds and microseconds since epoch
int gettimeofday(struct timeval *tv, void* notused) {
	uint64_t epoch;
	epoch=twr_epoch_timems();  // millisecond since epoch

	const uint64_t sec=epoch/1000;
	const uint64_t ms=epoch%1000;

	tv->tv_sec=(unsigned long)sec;
	tv->tv_usec=(unsigned long)ms*1000;

	return 0;
}

