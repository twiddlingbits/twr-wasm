#ifndef __TWR_TIME_H__
#define __TWR_TIME_H__

#include "twr-wasm.h"

#ifdef __cplusplus
extern "C" {
#endif

// in twr-crt.h -> typedef unsigned long time_t;
#define time(t) twr_time(t)

// These are Not part of the C runtime standard, but are part of posix and used by libc++
// These are normally defined in sys/time.h

int gettimeofday(struct timeval *tv, void *) {return twr_gettimeofday(tv);}

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



