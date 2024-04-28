
#ifndef __TINY_STRING_H__
#define __TINY_STRING_H__

#include "stddef.h"

#ifdef __cplusplus
extern "C" {
#endif

static inline size_t strlen(const char * str) {return (size_t)twr_strlen(str);}
#define strdup(x) twr_strdup(x)
#define strcpy(x, y) twr_strcpy(x,y)
#define strncpy(x,y,z) twr_strncpy(x,y,z)
#define strcmp(x,y) twr_strcmp(x, y)
#define strcat_s(x,y,z) twr_strcat_s(x,y,z);
#define strnicmp(x,y,z) twr_strnicmp(x, y, z)
#define stricmp(x,y) twr_stricmp(x, y)
#define strncmp(x,y,z) twr_strncmp(x,y,z)
#define strstr(x,y) twr_strstr(x, y)
#define twr_strhorizflip(x,y) twr_strhorizflip(x,y) 

static inline void *memmove(void *dest, const void *src, size_t n) {return twr_memmove(dest, src, (twr_size_t)n);}
static inline int memcmp(const void* lhs, const void* rhs, size_t count) { return twr_memcmp(lhs, rhs, (twr_size_t)count);}
static inline void bzero (void *to, size_t count) {twr_bzero(to, (twr_size_t)count);}

// defined in twr-wasm-c, implemented in memcpy.wat
void *memcpy(void *dest, const void * src, size_t n);
void *memset(void *mem, int c, size_t n);

#ifdef __cplusplus
}
#endif

#endif
