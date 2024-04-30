#include <errno.h>

static int the_errno;

int * _errno(void) {
	return &the_errno;
}

errno_t  _set_errno(int _Value) {
	the_errno=_Value;
	return 0;
}
errno_t  _get_errno(int *_Value) {
	return the_errno;
}
