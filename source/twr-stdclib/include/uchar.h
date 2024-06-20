
#ifndef __TWR_UCHAR_H__
#define __TWR_UCHAR_H__

#include <_stdtypes.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifndef __cplusplus
// In C++11 and later, char16_t is a built-in type it does not require any specific header for its declaration.
typedef uint_least32_t char32_t;
typedef uint_least16_t char16_t;
#endif

typedef struct {
} mbstate_t;

size_t c32rtomb( char* s, char32_t c32, mbstate_t* ps );
size_t c16rtomb( char* s, char16_t c16, mbstate_t* ps );

#ifdef __cplusplus
}
#endif

#endif // __TWR_UCHAR_H__
