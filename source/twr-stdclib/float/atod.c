#include <stdint.h>
#include <assert.h>

#include "twr-crt.h"
#include "twr-float-util.h"

static uint32_t calcdigit2(struct twr_bigint * value_num, struct twr_bigint * value_den, uint64_t sub_donedigits, int shift2);
static int atobigfraction(const char *str, struct twr_bigint *num, struct twr_bigint *den, int *sign);


// compatible with atof
// does not currently implement hexadecimal floating-point expression.
// does not implement NAN(char_sequence) (NAN okay)

double twr_atod(const char* str)
{
	int sign;
	struct twr_bigint value_num, value_den;
	
	/** handle infinity and nan */
	if (strnicmp(str, "inf", 3)==0 || strnicmp(str, "infinity", 3)==0) 
		return twr_infval();

	if (strnicmp(str, "nan", 3)==0) 
		return twr_nanval();

  /* scan decimal digits and create a big int fraction with the result */
	int err=atobigfraction(str, &value_num, &value_den, &sign);
	if (err>0) return twr_infval();
	if (err<0) return 0.0;

	/* now convert bigfraction into form of mantissa x 2^firtdigitpos */
	/* except that mantissa will include the leading 1 that is dropped in normalized doubles */
	/* and mantissa is shifted left 1 bit to include a rounding bit */

	int firstdigitpos = twr_big_2log(&value_num, &value_den);  //   eg "1" returns 0.  ".1" returns -1.
	if (firstdigitpos==BIGINT_LOG_OFZERO_ERROR) return 0.0;	/* log 0  */
	
	const int numdigits_toemit=54;  /* size of double mantissa + presumed 1 + roundbit */
	uint64_t mantissa=0;
	for (int i=0; i < numdigits_toemit; i++) {
		mantissa<<=1;
		uint32_t digit=calcdigit2(&value_num, &value_den, mantissa, firstdigitpos-i);
		// mantissa=mantissa*2+digit;
		mantissa+=digit;
	}

	if (firstdigitpos < -1022) {    /** is de-normalized double? */
		const int shift=-(firstdigitpos+1022);
		mantissa=mantissa>>shift;   /* shift out everything except round bit */
		int round=mantissa&1;
		mantissa=mantissa>>1;
		mantissa=mantissa+round;  /* this could flip the denormalized value into a normalized value */
		int n=numdigits2(mantissa);
		assert(n<=53);
		if (n==53) {
			firstdigitpos++;
			assert(firstdigitpos==-1022);
		}
	}
	else { /* normalized double */
		int round=mantissa&1;
		mantissa=mantissa>>1;
		mantissa=mantissa+round;  /* this could increase the bit-size of the mantissa  */
		int n=numdigits2(mantissa);
		assert(n<=54);   /* 54 is rounding added a digit */
		if (n==54) {
			firstdigitpos++;
			mantissa=mantissa>>1;
		}
	}

	int exp;
	int n=numdigits2(mantissa);
	if (n==0) 
		return 0.0;  

	if (firstdigitpos > 1023) {
		return twr_infval();
	}
	else if (firstdigitpos >= -1022)	{   /* normalized */
		exp=firstdigitpos+1023;
		assert(exp==(exp&0x7ff));
		exp=exp&0x7ff;  // shouldn't be needed...
		mantissa=mantissa & 0x000FFFFFFFFFFFFF;  // drop leading 1
	}
	else {  /* de-normalized */
		exp=0;
	}

   uint64_t exponent = exp;
	exponent = exponent << 52;
	uint64_t signbit= (sign==-1?((uint64_t)1<<63):0);
	uint64_t output = signbit|exponent|mantissa;
	double result;
	memcpy(&result, &output, 8);

	return result;
}

static uint32_t calcdigit2(
	struct twr_bigint * value_num, 
	struct twr_bigint * value_den, 
	uint64_t sub_donedigits, 
	int shift2) {

	struct twr_bigint t, r, valuex,  dd;

	if (shift2 < 0) {
		twr_big_assign(&valuex, value_num);
		twr_big_shiftleft_bits(&valuex, -shift2);
		twr_big_div(&valuex, &r, &valuex, value_den);
	}
	else {
		twr_big_assign(&t, value_den);
		twr_big_shiftleft_bits(&t, shift2);
		twr_big_div(&valuex, &r, value_num, &t);
	}

	twr_big_assign64u(&dd, sub_donedigits);
	twr_big_sub(&t, &valuex, &dd);
	uint32_t digit=twr_big_get32u(&t);

	return digit;
}

// suports D as well as E to denote exponent (_fcvt MS version supported this)
static int atobigfraction(const char *str, struct twr_bigint *num, struct twr_bigint *den, int *sign) {
	struct twr_bigint leftofdec, rightofdec, exppow;
	int i, rightofdecdigits=0;
	int negexp=0;

	twr_big_bzero(&leftofdec);
	twr_big_bzero(&rightofdec);

	*sign=twr_atosign(str, &i);

	/** decode left of decimal (integer part)*/
	if (isdigit(str[i])) {
		int len=twr_big_atoi(str+i, &leftofdec);
		i=i+len;
	}

	/** decode right of decimal (fractional part) */
	if (str[i]=='.') {
		i++;
		rightofdecdigits=twr_big_atoi(str+i, &rightofdec);
		i=i+rightofdecdigits;
	}

	/** decode exponent */
	if (tolower(str[i])=='e' || tolower(str[i])=='d') {
		int len;

		i++;

		if (str[i]=='+') i++;
		else if (str[i]=='-') {
			negexp=1;
			i++;
		}

		int exp=(int)twr_atou64(str+i, &len, 10);
		if (twr_big_10pow(&exppow, exp)) return 1;
	}
	else 
		twr_big_assign32u(&exppow, 1);

	/** assemble the fraction **/
	if (rightofdecdigits>0) {
		if (twr_big_10pow(den, rightofdecdigits)) return -1;
		if (twr_big_mult(num, &leftofdec, den)) return 1;
		if (twr_big_add(num, num, &rightofdec)) return 1;
	}
	else{
		twr_big_assign(num, &leftofdec);
		twr_big_assign32u(den, 1);
	}
	if (negexp) {
		if (twr_big_mult(den, den, &exppow)) return -1;
	}
	else {
		if (twr_big_mult(num, num, &exppow)) return 1;
	}

	return 0;
}

