#include <assert.h>
#include <stdint.h>
#include <stddef.h>
#include "twr-crt.h"
#include "twr-bigint.h"
#include "twr-float-util.h"

// ecvt() - add?
// gcvt() - use this name?

/** convert floating point number to string. 
 * value - Number to be converted.
 * count - Number of digits after the decimal point.
 * dec - Pointer to the stored decimal-point position.
 * sign - Pointer to the stored sign indicator.
 * ****/

int twr_fcvt_s(
   char* buffer,
   twr_size_t sizeInBytes,
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
		nstrcopy(buffer, sizeInBytes, infstr, sizeof(infstr), fracpart_numdigits+1);
		*dec=1;
		return 0;
	}
	else if (fieval.isnan)  { /* nan */
		char nanstr[]="1#QNAN00000000000000000000000000000";
		nstrcopy(buffer, sizeInBytes, nanstr, sizeof(nanstr), fracpart_numdigits+1);
		*dec=1;
		return 0;
	}
	else if (fieval.iszero) {     /* zero */ 
		char zeros[] ="000000000000000000000000000000000000";
		nstrcopy(buffer, sizeInBytes, zeros, sizeof(zeros), fracpart_numdigits);
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

	twr_big_itoa(&result, buffer, sizeInBytes, 10);

	return 0;
}

/*******************************************************/
/*******************************************************/
/*******************************************************/

int fcvt_expect(const char* buffer, int dec, int sign, int error, const char* rb,  int rd, int rs) {
	if (twr_strcmp(buffer, rb)!=0) return 0;
	if (dec!=rd) return 0;
	if (sign!=rs) return 0;
	if (error!=0) return 0;

	return 1;
}

int twr_fcvt_unit_test() {
	char buffer[360];
 	int dec, sign, error;

	error=twr_fcvt_s(buffer, sizeof(buffer), 1, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0.5, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "5",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0.1, 2, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0.99999, 2, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "100",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), .000555555, 4, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "6",  -3, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 123.45, 3, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "123450",  3, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 1.04, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 1.06, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "11",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), -1.04, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  1, 1)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), -1.06, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "11",  1, 1)) return 0;	

	error=twr_fcvt_s(buffer, sizeof(buffer), -9.876, 3, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "9876",  1, 1)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(72057594037927936), 10, &dec, &sign);  //2^56
	if (!fcvt_expect(buffer, dec, sign, error, "720575940379279360000000000",  17, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(72057594037927937), 10, &dec, &sign);  //2^56+1
	if (!fcvt_expect(buffer, dec, sign, error, "720575940379279360000000000",  17, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(72057594037927936+16), 10, &dec, &sign);  //2^56+16
	if (!fcvt_expect(buffer, dec, sign, error, "720575940379279520000000000",  17, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(0.1e-18), 30, &dec, &sign);  
	if (!fcvt_expect(buffer, dec, sign, error, "100000000000",  -18, 0)) return 0;
	
	error=twr_fcvt_s(buffer, sizeof(buffer), (double)6.54321e+200, 10, &dec, &sign);  
	if (!fcvt_expect(buffer, dec, sign, error, "6543209999999999561461578727841808536676238014554206487411164761511588201120188491102838911919793884914712609471921587675606823921054952492339799962922243734546177255394661967753070612297755130981253120000000000",  201, 0)) return 0;

	if (0!=twr_fcvt_s(buffer, sizeof(buffer)/3, (double)6.54321e+200, 10, &dec, &sign)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)6.54321e-200, 10, &dec, &sign); 
	if (!fcvt_expect(buffer, dec, sign, error, "",  -199, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)6.54321e-200, 210, &dec, &sign); 
	if (!fcvt_expect(buffer, dec, sign, error, "65432100000",  -199, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)3.6e-310, 350, &dec, &sign); // un-normalized
	if (!fcvt_expect(buffer, dec, sign, error, "36000000000000087643837346930308760325595",  -309, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0, 1, &dec, &sign);   // test zero (which is denormalized)
	if (!fcvt_expect(buffer, dec, sign, error, "0",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0, 2, &dec, &sign);   // test zero (which is denormalized)
	if (!fcvt_expect(buffer, dec, sign, error, "00",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), twr_nanval(), 20, &dec, &sign);   
	if (!fcvt_expect(buffer, dec, sign, error, "1#QNAN000000000000000",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer),twr_infval(), 20, &dec, &sign);   
	if (!fcvt_expect(buffer, dec, sign, error, "1#INF0000000000000000",  1, 0)) return 0;

	return 1;
}

