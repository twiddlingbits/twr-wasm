#include "twr-crt.h"

int twr_minint(int a, int b) {
	return a<b?a:b;
}

int twr_maxint(int a, int b) {
	return a>b?a:b;
}

int twr_misc_unit_test() {
	if (twr_minint(5, 100)!=5) return 0;
	if (twr_maxint(5, 100)!=100) return 0;

	return 1;
}

/**************************************************/

int twr_isnan(double v) {
	return __builtin_isnan(v);
}

int twr_isinf(double v) {
	return __builtin_isinf(v);
}

double twr_nanval() {
	return __builtin_nan("");
}

double twr_infval() {
	return __builtin_inf();
}

/**************************************************/

// for internal use, not an export
void nstrcopy(char *dest, const int sizeInBytes, const char *src, const int sizeofsrc, int n) {
	if (n>0) {
		if (n>sizeofsrc) n = sizeofsrc;
		if (n>sizeInBytes-1) n=sizeInBytes-1;
		twr_strncpy(dest, src, n);
	}
	if (n>=0) dest[n]=0;
	else if (sizeInBytes>0) dest[0]=0;
}




