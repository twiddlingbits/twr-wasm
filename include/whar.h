
#ifndef __TWR_WCHAR_H__
#define __TWR_WCHAR_H__

// wide char are not implemented
// aw note: I include this to eliminate the following libcxx build error:
// error: "We don't know how to get the definition of mbstate_t without <wchar.h> on your platform."
// this define needs to match uchar.h
typedef struct {
} mbstate_t;

#endif // __TWR_UCHAR_H__
