#include "twr-crt.h"
#include "twr-wasm.h"

// return seconds since epoch
unsigned long twr_time(unsigned long *time) {
    const uint64_t ms=twr_wasm_time();  
	 const uint64_t sec=ms/1000;
    if (time) *time=(unsigned long)sec;
    return (unsigned long)sec;
}

// return seconds and microseconds since epoch
int twr_gettimeofday(struct timeval *tv) {
	uint64_t epoch;
	epoch=twr_wasm_time();  // millisecond since epoch

	const uint64_t sec=epoch/1000;
	const uint64_t ms=epoch%1000;

	tv->tv_sec=(unsigned long)sec;
	tv->tv_usec=(unsigned long)ms*1000;

	return 0;
}

