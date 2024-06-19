#ifndef __TWR__STDTYPES_H__
#define __TWR__STDTYPES_H__

typedef unsigned long size_t;
#define MAX_SIZE_T 2147483647  

#ifdef __cplusplus
#define NULL __null
#else
#define NULL ((void*)0)
#endif

typedef struct __locale_t_struct * locale_t;

#endif //__TWR__STDTYPES_H__
