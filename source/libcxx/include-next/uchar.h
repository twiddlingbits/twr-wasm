// aw note: I include this to eliminate the following libcxx build error:
// error: "We don't know how to get the definition of mbstate_t without <wchar.h> on your platform."
// see: https://github.com/llvm/llvm-project/issues/84884


#ifndef __UCHAR_PLACEHOLDER__
#define __MYUCHAR__

typedef struct {
} mbstate_t;


#endif  // __UCHAR_PLACEHOLDER__
