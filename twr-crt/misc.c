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




