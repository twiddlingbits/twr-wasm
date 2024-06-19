// this file langinfo.h is here to help libcxx build
// we don't support the langinfo.h posix C extension.
// but libcxx includes langinfo.h instead of including locale.h, and then uses posix functions defined in locale.h, like newlocale(), which we support

#include <locale.h>
