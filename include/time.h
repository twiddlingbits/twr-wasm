#ifndef __TWR_TIME_H__
#define __TWR_TIME_H__

#include "twr-wasm.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef unsigned long time_t;

//time_t time( time_t *arg );
#define time(t) twr_wasm_time(t)


#ifdef __cplusplus
}
#endif

#endif /* __TWR_TIME_H__ */



