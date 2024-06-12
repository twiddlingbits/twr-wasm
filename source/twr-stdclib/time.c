#include <time.h>
#include <stdlib.h>
#include "twr-jsimports.h"
#include "twr-crt.h"  //twr_epoch_timems

// return seconds since epoch
time_t time(time_t *time) {
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

static struct tm *the_tm;

// fill in and return struct tm based on passed in time_t & local TZ
struct tm *localtime(const time_t *timer) {
	if (the_tm==NULL) {
		the_tm=malloc(sizeof(struct tm));
		the_tm->tm_zone=NULL;
	}
	if (the_tm->tm_zone) {
		free(the_tm->tm_zone);
		the_tm->tm_zone=NULL;
	}
	twrTimeTmLocal(the_tm, *timer);
	return the_tm;
}

int time_unit_tests() {
	time_t epoch=time(NULL);
	struct tm *t=localtime(&epoch);
	io_printf(stdout, "localtime:\n");
	io_printf(stdout, "tm_sec %d\n", t->tm_sec);
	io_printf(stdout, "tm_min %d\n", t->tm_min);
	io_printf(stdout, "tm_hour %d\n", t->tm_hour);
	io_printf(stdout, "tm_mday %d\n", t->tm_mday);
	io_printf(stdout, "tm_mon %d\n", t->tm_mon);
	io_printf(stdout, "tm_year %d\n", t->tm_year);
	io_printf(stdout, "tm_wday %d\n", t->tm_wday);
	io_printf(stdout, "tm_yday %d\n", t->tm_yday);
	io_printf(stdout, "tm_isdst %d\n", t->tm_isdst);
	io_printf(stdout, "tm_gmtoff %d\n", t->tm_gmtoff);
	io_printf(stdout, "tm_zone '%s'\n", t->tm_zone);

	return 1;
}



