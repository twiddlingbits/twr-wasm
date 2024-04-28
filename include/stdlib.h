#ifndef __TINY_STDLIB_H__
#define __TINY_STDLIB_H__

#include "stddef.h" 

#ifdef __cplusplus
extern "C" {
#endif

static inline void* malloc(size_t size ) {return twr_malloc((twr_size_t)size);}
static inline void free(void* mem) {twr_free(mem);}
static inline size_t avail(void) {return (size_t)twr_avail();}
static inline void* realloc( void *ptr, size_t new_size ) {return twr_realloc(ptr, (twr_size_t)new_size);}
static inline void* calloc(size_t num, size_t size) {return twr_calloc((twr_size_t)num, (twr_size_t)size);}
static inline void *aligned_alloc( size_t alignment, size_t size ) {return twr_aligned_alloc((twr_size_t)alignment, (twr_size_t)size);}

#define RAND_MAX TWR_RAND_MAX

#define rand(x) twr_rand(x)
#define srand(x) twr_srand(x)

#define __min(x, y) twr_minint(x, y)
#define __max(x, y) twr_maxint(x, y)

#define atof(x) twr_atof(x)
#define atoi(x) twr_atoi(x)
#define atol(x) twr_atol(x)
#define atoll(x) twr_atoll(x)
#define strtol(a,b,c) twr_strtol(a,b,c)
#define _itoa_s(x,y,z,zz) twr_itoa_s(x,y,z,zz)

#define _fcvt_s(a,b,c,d,e,f) twr_fcvt_s(a,b,c,d,e,f)

inline div_t div( int x, int y ) {return twr_div(x,y);}
inline ldiv_t ldiv( long x, long y ) {return twr_ldiv(x,y);}
inline lldiv_t lldiv( long long x, long long y ) {return twr_lldiv(x,y);}

inline _Noreturn void abort(void) {twr_abort();}

#ifdef __cplusplus
}
#endif

#endif
