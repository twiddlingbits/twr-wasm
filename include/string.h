
#ifndef __TWR_STRING_H__
#define __TWR_STRING_H__

#include <_stdtypes.h>
#include <locale.h>

#ifdef __cplusplus
extern "C" {
#endif

size_t strlen(const char * str);
char *strdup(const char * source);
char *strcpy(char *dest, const char *source);
int strcat_s(char *dest, size_t destsz, const char *src);
char* strcat(char *dest, const char *src);
char *strncpy(char *dest, const char *source, size_t count);
int strcmp(const char* string1, const char* string2);
int strncmp(const char* lhs, const char* rhs, size_t count);
int stricmp(const char* string1, const char* string2);
int strnicmp(const char* string1, const char* string2, size_t count);
int strcoll(const char* lhs, const char* rhs);
int strcoll_l(const char* lhs, const char* rhs,  locale_t loc);
char *strchr(const char *str, int ch);
void *memchr(const void *ptr, int ch, size_t count);
size_t strxfrm(char *dest, const char *source, size_t count);
size_t strxfrm_l(char *dest, const char *source, size_t count, locale_t __attribute__((__unused__)) locale);
char *strstr(const char *haystack, const char *needle);
char * strerror(int errnum );
char * _strerror(const char *strErrMsg);
void *memmove(void *dest, const void *src, size_t n);
int memcmp( const void* lhs, const void* rhs, size_t count );
void bzero (void *to, size_t count);

#define TWR_STRXFRM_MARKER 0xFFFFFFFF

// implemented in memcpy.wat
void *memcpy(void *dest, const void * src, size_t n);
void *memset(void *mem, int c, size_t n);

#ifdef __cplusplus
}
#endif

#endif
