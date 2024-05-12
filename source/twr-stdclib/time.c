#include <time.h>
#include <stdlib.h>
#include "twr-jsimports.h"
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

int time_unit_tests(void) {
	time_t epoch=time(NULL);
	struct tm *t=localtime(&epoch);
	twr_conlog("localtime:");
	twr_conlog("tm_sec %d", t->tm_sec);
	twr_conlog("tm_min %d", t->tm_min);
	twr_conlog("tm_hour %d", t->tm_hour);
	twr_conlog("tm_mday %d", t->tm_mday);
	twr_conlog("tm_mon %d", t->tm_mon);
	twr_conlog("tm_year %d", t->tm_year);
	twr_conlog("tm_wday %d", t->tm_wday);
	twr_conlog("tm_yday %d", t->tm_yday);
	twr_conlog("tm_isdst %d", t->tm_isdst);
	twr_conlog("tm_gmtoff %d", t->tm_gmtoff);
	twr_conlog("tm_zone '%s'", t->tm_zone);

	return 1;
}



