
#ifndef __TWR_STDDEF_H__
#define __TWR_STDDEF_H__

#include <_stdtypes.h>

#define offsetof(TYPE, MEMBER) __builtin_offsetof (TYPE, MEMBER)
typedef __PTRDIFF_TYPE__ ptrdiff_t;
typedef double max_align_t;

#endif	/* __TWR_STDDEF_H__ */
