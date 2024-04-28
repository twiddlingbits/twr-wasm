#ifndef __TINY_CTYPES_H__
#define __TINY_CTYPES_H__

#include "twr-crt.h"

#ifdef __cplusplus
extern "C" {
#endif

#define isgraph(x) twr_isgraph(x)
#define isspace(x) twr_isspace(x)
static inline int isdigit(int c) {return twr_isdigit(c);}
#define isalpha(x) twr_isalpha(x)
#define isalnum(x) twr_isalnum(x)
#define toupper(x) twr_toupper(x)
#define tolower(x) twr_tolower(x)

#ifdef __cplusplus
}
#endif

#endif

