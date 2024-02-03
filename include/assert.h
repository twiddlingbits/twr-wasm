/** derived from mingw-w64 runtime package  */

#undef assert

#ifndef __ASSERT_H_
#define __ASSERT_H_

#ifdef __cplusplus
extern "C" {
#endif

void _assert (const char *_Message, const char *_File, unsigned _Line);

#ifdef __cplusplus
}
#endif

#endif /* !defined (__ASSERT_H_) */

#ifdef NDEBUG
#define assert(_Expression) ((void)0)
#else /* !defined (NDEBUG) */
#define assert(_Expression) \
 (void) \
 ((!!(_Expression)) || \
  (_assert(#_Expression,__FILE__,__LINE__),0))
#endif /* !defined (NDEBUG) */

