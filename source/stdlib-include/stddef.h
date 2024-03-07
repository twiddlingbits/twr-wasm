
#ifndef __TINY_STDDEF_H__
#define __TINY_STDDEF_H__

#include "twr-crt.h"

#ifdef __cplusplus

#define NULL __null

#else

#define NULL ((void*)0)

#endif


typedef twr_size_t size_t;
#define MAX_SIZE_T TWR_MAX_SIZE_T  // size_t max
#define offsetof(TYPE, MEMBER) __builtin_offsetof (TYPE, MEMBER)


#endif	/* __TINY_STDDEF_H__ */
