
#ifndef __TINY_STRING_H__
#define __TINY_STRING_H__

#include "twr-crt.h"

#define strlen(x) twr_strlen(x)
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
#define memset(x,y,z) twr_memset(x,y,z)
#define memcpy(x,y,z) twr_memcpy(x,y,z)

#endif