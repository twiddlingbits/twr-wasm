#ifndef __TINY_CTYPES_H__
#define __TINY_CTYPES_H__

#ifdef __cplusplus
extern "C" {
#endif

int isgraph(int c);
int isspace(int c);
int isdigit(int c);
int isalpha(int c);
int isalnum(int c);
int toupper(int c);
int tolower(int c);

#ifdef __cplusplus
}
#endif

#endif

