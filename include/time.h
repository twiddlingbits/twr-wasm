#ifndef __TWR_TIME_H__
#define __TWR_TIME_H__

#include <_stdtypes.h>
#include <locale.h>

#ifdef __cplusplus
extern "C" {
#endif

struct tm {
	int	tm_sec;		/* seconds after the minute [0-60] */
	int	tm_min;		/* minutes after the hour [0-59] */
	int	tm_hour;		/* hours since midnight [0-23] */
	int	tm_mday;		/* day of the month [1-31] */
	int	tm_mon;		/* months since January [0-11] */
	int	tm_year;		/* years since 1900 */
	int	tm_wday;		/* days since Sunday [0-6] */
	int	tm_yday;		/* days since January 1 [0-365] */
	int	tm_isdst;	/* Daylight Saving Time flag */
	long	tm_gmtoff;	/* offset from UTC in seconds */
	char	*tm_zone;	/* timezone abbreviation */
};

// These are Not part of the C runtime standard, but are part of posix and used by libc++
// These are normally defined in sys/time.h
struct timeval {
	long tv_sec;
	long tv_usec;
};

typedef unsigned long time_t;
unsigned long time(unsigned long *time);
size_t strftime(char *s, size_t maxsize, const char *format, const struct tm *timeptr);
size_t strftime_l(char *s, size_t maxsize, const char *format, const struct tm *timeptr, locale_t __attribute__((__unused__)) locale);
struct tm *localtime(const time_t *timer);

int gettimeofday(struct timeval *tv, void* notused);

// from mingw public domain
#define timerisset(tvp)		((tvp)->tv_sec || (tvp)->tv_usec)
#define timercmp(tvp,uvp,cmp)					\
		((tvp)->tv_sec cmp (uvp)->tv_sec ||		\
		 ((tvp)->tv_sec == (uvp)->tv_sec && (tvp)->tv_usec cmp (uvp)->tv_usec))
#define timerclear(tvp)		(tvp)->tv_sec = (tvp)->tv_usec = 0

#ifdef __cplusplus
}
#endif

#endif /* __TWR_TIME_H__ */



