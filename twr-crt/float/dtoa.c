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
		twr_strncpy(buffer, "inf", buffer_size);
		return;
	}
	else if (fieeeval.isnan)  { /* nan */
		twr_strncpy(buffer, "nan", buffer_size);
		return;
	}
	else if (fieeeval.iszero) {     /* zero */ 
		twr_strncpy(buffer, "0", buffer_size);
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
		const int intlen=twr_strlen(here);
		here=here+intlen; herelen=herelen+intlen;
		assert(buffer_size>herelen);
		const char zstr[]="00000000000000000000";  // 20 zeros
		nstrcopy(here, buffer_size-herelen, zstr, sizeof(zstr), dec-n);
	}
	else if (dec <=0  && dec > -5) {  // fraction with up to 4 leading zeros
		twr_strcpy(here, "0.");
		here+=2;herelen+=2;
		const char zstr[]="00000000000000000000";  // 20 zeros
		const int zlen=-dec; 
		nstrcopy(here, buffer_size-herelen, zstr, sizeof(zstr), zlen);
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
		twr_strcat_s(here+i, buffer_size-i-herelen, tb+i);
	}
	else {  /* use E format */
		twr_big_remove_trailing_zeros(&trial.num);
		twr_big_itoa(&trial.num, here, buffer_size-herelen, 10);

		// insert radix
		int len=twr_strlen(here);
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
			twr_itoa_s(dec-1, here, buffer_size-herelen, 10);
		}
		else {
			*here='-';
			herelen++;here++;
			twr_itoa_s(-dec+1, here, buffer_size-herelen, 10);
		}
	}
}

/*******************************************************/
/*******************************************************/
/*******************************************************/


int twr_pretty_unit_test() {
	char buffer[360];

	twr_dtoa(buffer, sizeof(buffer), 0.1, -1);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.00003, -1);
	if (twr_strcmp(buffer, "0.00003")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1234567890123456, -1);
	if (twr_strcmp(buffer, "1234567890123456")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 123456789.0123456, -1);
	if (twr_strcmp(buffer, "123456789.0123456")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.000003, -1);
	if (twr_strcmp(buffer, "3E-6")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 123, -1);
	if (twr_strcmp(buffer, "123")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1000, -1);
	if (twr_strcmp(buffer, "1000")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.0003, -1);
	if (twr_strcmp(buffer, "0.0003")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 10.235, -1); 
	if (twr_strcmp(buffer, "10.235")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.0, -1);
	if (twr_strcmp(buffer, "0")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 10.23499965667724609375, -1);  // this is a float 32 example
	if (twr_strcmp(buffer, "10.234999656677246")!=0) return 0;
	
	double dv=twr_atof(" .1");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

	dv=twr_atof("10.235");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "10.235")!=0) return 0;

	dv=twr_atof("0.3");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "0.3")!=0) return 0;

	dv=twr_atof("3.3E123");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "3.3E+123")!=0) return 0;

	dv=twr_atof("0.1E-99");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "1E-100")!=0) return 0;

	dv=twr_atof("0.1234567E-99");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "1.234567E-100")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -0, -1);
	if (twr_strcmp(buffer, "0")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -1, -1);
	if (twr_strcmp(buffer, "-1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -0.1, -1);
	if (twr_strcmp(buffer, "-0.1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -50.05, -1);
	if (twr_strcmp(buffer, "-50.05")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.0988, -1);
	if (twr_strcmp(buffer, "0.0988")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 9.88e-300, -1);
	if (twr_strcmp(buffer, "9.88E-300")!=0) return 0;

	dv=twr_atof("-1.5E+50");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "-1.5E+50")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X1.FFFFFFFFFFFFFP+0, -1);  // mantissa all 1s
	if (twr_strcmp(buffer, "1.9999999999999998")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X1.0000000000000P+0, -1);  // mantissa almost all 0s
	if (twr_strcmp(buffer, "1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.8000000000000P-1022, -1); // first de-normalized value
	if (twr_strcmp(buffer, "1.1125369292536007E-308")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000008P-1022, -1);  
	if (twr_strcmp(buffer, "4E-323")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000004P-1022, -1);  
	if (twr_strcmp(buffer, "2E-323")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000002P-1022, -1);  
	if (twr_strcmp(buffer, "1E-323")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000001P-1022, -1);  // mantissa 1, last denorm. value
	if (twr_strcmp(buffer, "5E-324")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 2.2250738585072013e-30, -1);  
	if (twr_strcmp(buffer, "2.2250738585072013E-30")!=0) return 0;

	// check precision

	twr_dtoa(buffer, sizeof(buffer), 0.1, 6);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.1f, 6);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1.0/3.0, 6);
	if (twr_strcmp(buffer, "0.333333")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1000+1.0/3.0, 6);
	if (twr_strcmp(buffer, "1000.33")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1000.5, 6);
	if (twr_strcmp(buffer, "1000.5")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 100000.5, 6);
	if (twr_strcmp(buffer, "100001")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 100000.33333, 6);
	if (twr_strcmp(buffer, "100000")!=0) return 0;
	
	return 1;
}
