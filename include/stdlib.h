#ifndef __TINY_STDLIB_H__
#define __TINY_STDLIB_H__

#include "stddef.h" 

#define malloc(x) twr_malloc(x)
#define free(x) twr_free(x)
#define avail(x) twr_avail(x)

#define RAND_MAX TWR_RAND_MAX

#define rand(x) twr_rand(x)
#define srand(x) twr_srand(x)

#define __min(x, y) twr_minint(x, y)
#define __max(x, y) twr_maxint(x, y)

#define atof(x) twr_atof(x)
#define atoi(x) twr_atoi(x)
#define atol(x) twr_atol(x)
#define atoll(x) twr_atoll(x)
#define _itoa_s(x,y,z,zz) twr_itoa_s(x,y,z,zz)
// twr_isnan is defined
// twr_isinf
// twr_nanval
//twr_infval

// twr_logint(x)
// twr_logstr(x)

#endif
