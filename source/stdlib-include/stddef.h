
#ifndef __TINY_STDDEF_H__
#define __TINY_STDDEF_H__

#include "twr-crt.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef twr_size_t size_t;
#define MAX_SIZE_T TWR_MAX_SIZE_T  // size_t max

#define NULL ((void*)0)

#define offsetof(TYPE, MEMBER) __builtin_offsetof (TYPE, MEMBER)


#ifdef __cplusplus
}
#endif

#endif	/* __TINY_STDDEF_H__ */
