#ifndef __TINY_CTYPES_H__
#define __TINY_CTYPES_H__

#include <locale.h>

#ifdef __cplusplus
extern "C" {
#endif

int isascii(int);
int toascii(int);
int isalnum(int c);
int isalpha(int c);
int isblank(int);
int iscntrl(int);
int isdigit(int c);
int isgraph(int c);
int islower(int);
int isprint(int);
int ispunct(int);
int isspace(int c);
int isupper(int);
int isxdigit(int);
int tolower(int c);
int toupper(int c);

int isalnum_l(int c, locale_t loc);
int isalpha_l(int c, locale_t  __attribute__((__unused__)) loc);
int isblank_l(int c, locale_t  __attribute__((__unused__)) loc);
int iscntrl_l(int c, locale_t  __attribute__((__unused__)) loc);
int isdigit_l(int c, locale_t  __attribute__((__unused__)) loc);
int isgraph_l(int c, locale_t  __attribute__((__unused__)) loc);
int islower_l(int c, locale_t  __attribute__((__unused__)) loc);
int isprint_l(int c, locale_t  loc);
int ispunct_l(int c, locale_t  __attribute__((__unused__)) loc);
int isspace_l(int c, locale_t  __attribute__((__unused__)) loc);
int isupper_l(int c, locale_t  __attribute__((__unused__)) loc);
int isxdigit_l(int c, locale_t loc);
int tolower_l(int c, locale_t  __attribute__((__unused__)) loc);
int toupper_l(int c, locale_t  __attribute__((__unused__)) loc);

#ifdef __cplusplus
}
#endif

#endif

