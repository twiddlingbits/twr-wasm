#include <stdlib.h>
#include <string.h>
#include <twr-crt.h>

int abs(int n) {
    if (n<0) return -n;
    else return n;
}

/**************************************************/

// for internal use, not an export
void __nstrcopy(char *dest, const int sizeInBytes, const char *src, const int sizeofsrc, int n) {
	if (n>0) {
		if (n>sizeofsrc) n = sizeofsrc;
		if (n>sizeInBytes-1) n=sizeInBytes-1;
		strncpy(dest, src, n);
	}
	if (n>=0) dest[n]=0;
	else if (sizeInBytes>0) dest[0]=0;
}

/**************************************************/

int misc_unit_test() {
	if (__min(5, 100)!=5) return 0;
	if (__max(5, 100)!=100) return 0;

   if (abs(5)!=5) return 0;
   if (abs(-5)!=5) return 0;

	return 1;
}


