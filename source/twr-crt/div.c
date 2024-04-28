#include "twr-crt.h"

//Computes the quotient (the result of the expression x / y) and remainder (the result of the expression x % y) simultaneously.
// most compilers will optimize the separate but close operations into a single instruction

 div_t div( int x, int y ) {
	const div_t r = {.quot=x/y, .rem=x%y};
	return r;
 }

ldiv_t ldiv( long x, long y ) {
	const ldiv_t r = {.quot=x/y, .rem=x%y};
	return r;

}

lldiv_t lldiv( long long x, long long y ) { //(3)	(since C99)
	const lldiv_t r = {.quot=x/y, .rem=x%y};
	return r;
}


//Defined in header <inttypes.h>
//struct imaxdiv_t { intmax_t quot; intmax_t rem; };
//imaxdiv_t imaxdiv( intmax_t x, intmax_t y );
//(4)	(since C99)