#include <errno.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

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

#define STRERR_BUF_SIZE 140
char * _strerror(const char *strErrMsg) {
	static char* msgbuf;
	if (strErrMsg==NULL)	return strerror(the_errno);
	if (msgbuf==NULL) msgbuf=malloc(STRERR_BUF_SIZE);
	snprintf(msgbuf, STRERR_BUF_SIZE, "%s: %s", strErrMsg, strerror(the_errno));
	return msgbuf;
}

struct error_entry {
	int errnum;
	const char* shorterr;
	const char* longerr;
};

static struct error_entry all_errors[] = {
  {EPERM, "EPERM", "Not owner - Operation not permitted"},
  {ENOENT, "ENOENT", "No such file or directory"},
  {ESRCH, "ESRCH", "No such process"},
  {EINTR, "EINTR", "Interrupted system call"},
  {EIO, "EIO", "I/O error"},
  {ENXIO, "ENXIO", "No such device or address"},
  {E2BIG, "E2BIG", "Arg list too long"},
  {ENOEXEC, "ENOEXEC", "Exec format error"},
  {EBADF, "EBADF", "Bad file number"},
  {ECHILD, "ECHILD", "No child processes"},
  {EWOULDBLOCK, "EWOULDBLOCK", "Operation would block"},
  {EAGAIN, "EAGAIN", "No more processes"},
  {ENOMEM, "ENOMEM", "Not enough space"},
  {EACCES, "EACCES", "Permission denied"},
  {EFAULT, "EFAULT", "Bad address"},
  {EBUSY, "EBUSY", "Device busy"},
  {EEXIST, "EEXIST", "File exists"},
  {EXDEV, "EXDEV", "Cross-device link"},
  {ENODEV, "ENODEV", "No such device"},
  {ENOTDIR, "ENOTDIR", "Not a directory"},
  {EISDIR, "EISDIR", "Is a directory"},
  {EINVAL, "EINVAL", "Invalid argument"},
  {ENFILE, "ENFILE", "File table overflow"},
  {EMFILE, "EMFILE", "Too many open files"},
  {ENOTTY, "ENOTTY", "Not a typewriter"},
  {ETXTBSY, "ETXTBSY", "Text file busy"},
  {EFBIG, "EFBIG", "File too large"},
  {ENOSPC, "ENOSPC", "No space left on device"},
  {ESPIPE, "ESPIPE", "Illegal seek"},
  {EROFS, "EROFS", "Read-only file system"},
  {EMLINK, "EMLINK", "Too many links"},
  {EPIPE, "EPIPE", "Broken pipe"},
  {EDOM, "EDOM", "Math argument out of domain of func"},
  {ERANGE, "ERANGE", "Math result not representable"},
  {ENOMSG, "ENOMSG", "No message of desired type"},
  {EIDRM, "EIDRM", "Identifier removed"},
  {EDEADLK, "EDEADLK", "Deadlock condition"},
  {ENOLCK, "ENOLCK", "No record locks available"},
  {EDEADLOCK, "EDEADLOCK", "File locking deadlock error"},
  {ENOSTR, "ENOSTR", "Device not a stream"},
  {ENODATA, "ENODATA", "No data available"},
  {ETIME, "ETIME", "Timer expired"},
  {ENOSR, "ENOSR", "Out of streams resources"},
  {ENOLINK, "ENOLINK", "Link has been severed"},
  {EPROTO, "EPROTO", "Protocol error"},
  {EBADMSG, "EBADMSG", "Not a data message"},
  {ENAMETOOLONG, "ENAMETOOLONG", "File name too long"},
  {EOVERFLOW, "EOVERFLOW", "Value too large for defined data type"},
  {EILSEQ, "EILSEQ", "Illegal byte sequence"},
  {ENOSYS, "ENOSYS", "Operation not applicable"},
  {ELOOP, "ELOOP", "Too many symbolic links encountered"},
  {ENOTEMPTY, "ENOTEMPTY", "Directory not empty"},
  {ENOTSOCK, "ENOTSOCK", "Socket operation on non-socket"},
  {EDESTADDRREQ, "EDESTADDRREQ", "Destination address required"},
  {EMSGSIZE, "EMSGSIZE", "Message too long"},
  {EPROTOTYPE, "EPROTOTYPE", "Protocol wrong type for socket"},
  {ENOPROTOOPT, "ENOPROTOOPT", "Protocol not available"},
  {EPROTONOSUPPORT, "EPROTONOSUPPORT", "Protocol not supported"},
  {EOPNOTSUPP, "EOPNOTSUPP", "Operation not supported on transport endpoint"},
  {EAFNOSUPPORT, "EAFNOSUPPORT", "Address family not supported by protocol"},
  {EADDRINUSE, "EADDRINUSE", "Address already in use"},
  {EADDRNOTAVAIL, "EADDRNOTAVAIL","Cannot assign requested address"},
  {ENETDOWN, "ENETDOWN", "Network is down"},
  {ENETUNREACH, "ENETUNREACH", "Network is unreachable"},
  {ENETRESET, "ENETRESET", "Network dropped connection because of reset"},
  {ECONNABORTED, "ECONNABORTED", "Software caused connection abort"},
  {ECONNRESET, "ECONNRESET", "Connection reset by peer"},
  {ENOBUFS, "ENOBUFS", "No buffer space available"},
  {EISCONN, "EISCONN", "Transport endpoint is already connected"},
  {ENOTCONN, "ENOTCONN", "Transport endpoint is not connected"},
  {ETIMEDOUT, "ETIMEDOUT", "Connection timed out"},
  {ECONNREFUSED, "ECONNREFUSED", "Connection refused"},
  {EHOSTUNREACH, "EHOSTUNREACH", "No route to host"},
  {EALREADY, "EALREADY", "Operation already in progress"},
  {EINPROGRESS, "EINPROGRESS", "Operation now in progress"},
  {0, NULL, NULL}
};

char * strerror(int errnum) {
	if (errnum==0) return (char*)"No error";
	int k=0;
	while(1) {
		if (all_errors[k].errnum==0 && all_errors[k].shorterr==NULL && all_errors[k].longerr==NULL)
			return  (char*)"Unknown error code";
			
		if (all_errors[k].errnum==errnum)
			return (char*)all_errors[k].longerr;

		k++;
	}
}

