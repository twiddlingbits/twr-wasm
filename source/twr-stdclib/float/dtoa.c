#include <assert.h>
#include <stdint.h>
#include <stddef.h>
#include "twr-crt.h"
#include "twr-float-util.h"

// This file implements double to string conversion.  It produces the minimum digits necessary to
// identify the number. Up to a maximum of the specified max_precision.
// It is similar to printf("%g").
// 
// There are faster more optimized implementations (see below), but this one is
// accurate,  strait forward to understand, but was fun to write.
//
// status 1/6/24
// should I add digit after decimal in case like 4E-10 -> 4.0E-10 ?  Right now prints shortest possible # digits.
// if round digit is 5 followed by all zeros, I don't "round even" which others do
//
// Internet Sources of Information on this problem.
// https://www.ryanjuckett.com/printing-floating-point-numbers/
// https://www.youtube.com/watch?v=kw-U6smcLzk
// https://stackoverflow.com/questions/54162152/what-precisely-does-the-g-printf-specifier-mean
// https://github.com/apple/swift/blob/main/stdlib/public/runtime/SwiftDtoa.cpp
//

/*****************************************/
/*****************************************/
/*****************************************/

/* generate  the base 10 text representation of a double until the generated digits fully identify the double */
/* max_precision is the maxim number of decimal digits to generate (which may be less than needed to uniquely  */
/* identify the double */
/* set to -1 for the default maximum  (which is many digits) */
/* use max_precision=6 to match %g printf's default */

void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision) {
	struct floatieee fieeeval;

	/** deconstruct double into sign, mantissa, exponent */
	floatieee_new(&fieeeval, value); 

	/** handle special cases - zero, infinity, nan */
	if (buffer_size<4 || buffer==NULL) return;  // error

	if (fieeeval.isinf) {    /* infinity */
		strncpy(buffer, "inf", buffer_size);
		return;
	}
	else if (fieeeval.isnan)  { /* nan */
		strncpy(buffer, "nan", buffer_size);
		return;
	}
	else if (fieeeval.iszero) {     /* zero */ 
		strncpy(buffer, "0", buffer_size);
		return;
	}

	/* create a bigint fraction to represent the double */
	struct float2 float2val;	
   float2_new(&float2val, &fieeeval);

	struct frac2 frac2val;
	frac2_new(&frac2val, &float2val);	

	struct frac10 frac10val;
	frac10_new(&frac10val, &frac2val);

/** generate input value with one lower and one higher mantissa value */	
	struct float2 float2minus, float2plus;
	struct frac2 frac2plus, frac2minus;
	struct frac10 frac10plus, frac10minus;

	float2minus=float2val;
	float2_dec_mantissa(&float2minus);
	frac2_new(&frac2minus, &float2minus);	
	frac10_new(&frac10minus, &frac2minus);

	float2plus=float2val;
	float2_inc_mantissa(&float2plus);
	frac2_new(&frac2plus, &float2plus);	
	frac10_new(&frac10plus, &frac2plus);	

	struct twr_bigint bigval, bigplus, bigminus;

/* adjust denominators so they are all the same.  Allows us to compare numerators */
	frac10_match_den(&frac10val, &frac10plus, &frac10minus);  

/** calculate difference between input value and higher/lower mantissas */
	twr_big_assign(&bigval, &frac10val.num);
	twr_big_assign(&bigplus, &frac10plus.num);
	twr_big_assign(&bigminus, &frac10minus.num);

	struct twr_bigint diffminus, diffplus;
	twr_big_sub(&diffminus, &bigval, &bigminus);
	twr_big_sub(&diffplus, &bigplus, &bigval);
	twr_big_shiftright_onebit(&diffminus);  //divide by two
	twr_big_shiftright_onebit(&diffplus);   //divide by two 

	/* at this point, diff==half the distance to the closest higher/lower mantissa */
	/* now generate digits until within diff of full precision (defined as using all the mantissa bits) */
	/* ie, digits beyond "diff" not needed to identify this value, since not all decimal numbers */
	/* are representable by a base 2 float */
	struct twr_bigint trialdiff;
	struct frac10 trial;
	int i;

	if (max_precision<0) max_precision=40;  // arbitrary
	if (max_precision==0) max_precision=1;

	for (i=1; i <= max_precision; i++) {
		trial=frac10val;  // copy
		frac10_round_b(&trial, i);
		frac10_adjust_den(&trial, frac10val.denexp);
		
		if (twr_big_isgt(&trial.num, &bigval)) {
			twr_big_sub(&trialdiff, &trial.num,  &bigval);
			/* if difference between trail (lower precision) and full precision is less than */
			/* half the distance to the upper or lower values, stop print digits. */
			if (twr_big_islt(&trialdiff, &diffplus)) 
				break;
		}
		else {
			twr_big_sub(&trialdiff, &bigval, &trial.num);
			if (twr_big_islt(&trialdiff, &diffminus)) 
				break;
		}
	}

	frac10_simplify(&trial);
	int n=twr_big_num10digits(&trial.num);

	const int firstdigitpos = frac10_10log(&trial);  //   eg "5" returns 0.  ".1" returns -1.
	const int dec=firstdigitpos+1;

	char* here=buffer;
	int herelen=0;
	if (fieeeval.sign) { // negative?
		here[0]='-';
		here[1]=0;
		here++;herelen++;
	}

  if (dec >= n && dec < 18) {  // integer with possible missing trailing zeros; max 17 digits
		twr_big_itoa(&trial.num, here, buffer_size-herelen, 10);
		const int intlen=strlen(here);
		here=here+intlen; herelen=herelen+intlen;
		assert(buffer_size>herelen);
		const char zstr[]="00000000000000000000";  // 20 zeros
		__nstrcopy(here, buffer_size-herelen, zstr, sizeof(zstr), dec-n);
	}
	else if (dec <=0  && dec > -5) {  // fraction with up to 4 leading zeros
		strcpy(here, "0.");
		here+=2;herelen+=2;
		const char zstr[]="00000000000000000000";  // 20 zeros
		const int zlen=-dec; 
		__nstrcopy(here, buffer_size-herelen, zstr, sizeof(zstr), zlen);
		here=here+zlen; herelen=herelen+zlen;
		assert(buffer_size>herelen);
		twr_big_itoa(&trial.num, here, buffer_size-herelen, 10);
	}
	else if (dec > 0 && n > dec ) { // int.frac case (print all digits)
		char tb[50];
		twr_big_itoa(&trial.num, tb, sizeof(tb), 10);
		for (i=0; i<dec; i++) 
			here[i]=tb[i];
		here[i]='.';
		here[i+1]=0;
		strcat_s(here+i, buffer_size-i-herelen, tb+i);
	}
	else {  /* use E format */
		twr_big_remove_trailing_zeros(&trial.num);
		twr_big_itoa(&trial.num, here, buffer_size-herelen, 10);

		// insert radix
		int len=strlen(here);
		if (len>1) {
			for (i=len+1; i>1; i--)
				here[i]=here[i-1];
			here[1]='.';
			len++;
		}

		here=here+len;
		herelen=herelen+len;
			
		*here='E';
		herelen++;here++;

		if (dec>0) {
			*here='+';
			herelen++;here++;
			_itoa_s(dec-1, here, buffer_size-herelen, 10);
		}
		else {
			*here='-';
			herelen++;here++;
			_itoa_s(-dec+1, here, buffer_size-herelen, 10);
		}
	}
}
