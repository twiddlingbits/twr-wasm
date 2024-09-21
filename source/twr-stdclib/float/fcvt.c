#include <assert.h>
#include <stdint.h>
#include <stddef.h>
#include "twr-crt.h"
#include "twr-float-util.h"

// ecvt() - add?
// gcvt() - use this name?

/** convert floating point number to string. 
 * value - Number to be converted.
 * count - Number of digits after the decimal point.
 * dec - Pointer to the stored decimal-point position.
 * sign - Pointer to the stored sign indicator.
 * ****/

int _fcvt_s(
   char* buffer,
   size_t sizeInBytes,
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
) {
	struct floatieee fieval;
	floatieee_new(&fieval, value);

	/** handle special cases - zero, infinity, nan */
	if (sizeInBytes<1 || buffer==NULL) return 1;  // error

	if (fieval.isinf) {    /* infinity */
		char infstr[]="1#INF00000000000000000000000000000";
		__nstrcopy(buffer, sizeInBytes, infstr, sizeof(infstr), fracpart_numdigits+1);
		*dec=1;
		return 0;
	}
	else if (fieval.isnan)  { /* nan */
		char nanstr[]="1#QNAN00000000000000000000000000000";
		__nstrcopy(buffer, sizeInBytes, nanstr, sizeof(nanstr), fracpart_numdigits+1);
		*dec=1;
		return 0;
	}
	else if (fieval.iszero) {     /* zero */ 
		char zeros[] ="000000000000000000000000000000000000";
		__nstrcopy(buffer, sizeInBytes, zeros, sizeof(zeros), fracpart_numdigits);
		*dec=0;
		return 0;
	}

	struct float2 flt2val;	
   float2_new(&flt2val, &fieval);  /* unconstrained ieee double */
	struct frac2 frac2val;
	frac2_new(&frac2val, &flt2val); /* create a bigint fraction base 2 version of double */

	/** firstdigitpos eg: d2f==1000 is 3, 9999 is 3,  0.1 is -1, 0.01 is -2 */
	/*  df2=9999, df2/10^firstdigitpos is 9, the first digit. */
	int firstdigitpos = frac2_10log(&frac2val); //   eg "5" returns 0.  ".1" returns -1.
	*dec=firstdigitpos+1;
	*sign=flt2val.sign;
	
	int numdigits_toemit=fracpart_numdigits+firstdigitpos+1;
	if (numdigits_toemit<=0) {
			buffer[0]=0;  
			return 0;
	}

	struct twr_bigint result;

	(*dec)+=frac2_get_digits(&frac2val, &result, firstdigitpos-(numdigits_toemit-1), 1);

	int error=twr_big_itoa(&result, buffer, sizeInBytes, 10);

	return error;
}

