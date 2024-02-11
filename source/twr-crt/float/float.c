#include <assert.h>
#include "twr-crt.h"
#include "twr-float-util.h"

/**************************************************/
/**************************************************/
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
/**************************************************/
/**************************************************/

/* deconstruct a double into its integer parts */
void floatieee_new(struct floatieee* fie, double value)
{
/* normalized value : (2^52 + mantissa) * 2^(exponent - 1023 - 52) */
/* de-normalized value (exponent:=0) : (mantissa) * 2^(1 - 1023 - 52)  */
	uint64_t input;
   twr_memcpy(&input, &value, 8);
	fie->expraw=(input >> 52) & 0x7ff;
	fie->mantissa = input & 0x000FFFFFFFFFFFFF;  /** bottom 52 bits are fractional part */
	fie->sign=input>>63;

	fie->doubleval=value;

	fie->isinf=0;	
	fie->isnan=0;
	fie->iszero=0;
	fie->isdenormal=0;

	if (fie->expraw==0x7FF) {
			if (fie->mantissa==0)    		/* infinity */
				fie->isinf=1; 
			else if (fie->mantissa>0)  	/* nan */
				fie->isnan=1; 
	}
	else if (fie->expraw==0) { 			/* de-normalized */
		fie->isdenormal=1;
		if (fie->mantissa==0) {   			/* zero */
			fie->iszero=1;
		}
	}
}

void floatieee_from_float2(struct floatieee* fie, struct float2* f2)
{
	uint64_t mantissa=f2->mantissa;
	int16_t exp=f2->exp;

	if (mantissa==0) {
		floatieee_bzero(fie);
		return;
	}

	/** normalize to a 53 bit mantissa */
	int n=numdigits2(mantissa);
	int adj=n-53;
	if (adj>0) {
		int round=0; /** round if precision lost */
		mantissa=mantissa>>(adj-1);  
		round=mantissa&1;
		mantissa=mantissa>>1;
		if (round) mantissa++;
		if (numdigits2(mantissa) > 53) {  // optimize by looking for the only value of mantissa that can round a digit?
			mantissa=mantissa>>1;
			adj++;
		}
	}
	else if (adj<0) { 
		mantissa=mantissa<<(-adj);
	}

	fie->isnan=0;
	fie->isinf=0;
	fie->iszero=0;
	fie->isdenormal=0;

	exp=exp+adj;


	/** here with 53 bit mantissa **/
	/** adjust exponent to allowable range */
	
	if (exp>1023) { // too big to fit in an ieee double
		floatieee_binf(fie);
		return;
	}
	else if (exp < -1022-52) {
		floatieee_bneginf(fie);
		return;
	}
	else if (exp < -1022) {  // fit by denormalizing
		int i=-(exp+1022);
		fie->mantissa=mantissa>>i;
		fie->expraw=0;
		fie->isdenormal=1;
	}
	else {
		fie->mantissa=mantissa&0x000FFFFFFFFFFFFF;
		exp=exp+1023;
		assert(exp>0 && exp < 2047);
		fie->expraw=exp;
	}

	fie->sign=f2->sign;

   uint64_t exponent = ((uint64_t)fie->expraw)<<52;
	uint64_t signbit= ((uint64_t)fie->sign)<<63;
	uint64_t output = signbit|exponent|fie->mantissa;
	twr_memcpy(&fie->doubleval, &output, 8);
}

void floatieee_binf(struct floatieee* fie) {
	fie->isnan=0;
	fie->iszero=0;
	fie->isinf=1;
	fie->sign=0;
	fie->expraw=0x7ff;
	fie->mantissa=0;
	fie->doubleval=twr_infval();
}

void floatieee_bneginf(struct floatieee* fie) {
	fie->isnan=0;
	fie->iszero=0;
	fie->isinf=1;
	fie->sign=1;
	fie->expraw=0x7ff;
	fie->mantissa=0;
	fie->doubleval=-twr_infval(); 
}

void floatieee_bzero(struct floatieee* fie) {
	fie->isinf=0;
	fie->isnan=0;
	fie->sign=0;
	fie->expraw=0;
	fie->mantissa=0;
	fie->iszero=1;
	fie->doubleval=0.0;
}


/**************************************************/
/**************************************************/
/**************************************************/

/** a deconstructed floating point number with the ieee special cases removed **/
void float2_new(struct float2 *f2, struct floatieee* fie) {
	f2->mantissa = fie->mantissa;  
	f2->sign=fie->sign;

	if (fie->isdenormal) { // de-normalized
		if (fie->iszero) 
			f2->exp=0;
		else 
			f2->exp=-1022;
	}
	else {  // normalized double
   	f2->exp = (int)fie->expraw-1023; 
		f2->mantissa=f2->mantissa | (1ULL<<52);
	}
}

void float2_inc_mantissa(struct float2 *f2) {
	assert(f2->mantissa!=UINT64_MAX);   // i don't currently handle this case
	f2->mantissa++;  
}

void float2_dec_mantissa(struct float2 *f2) {
	assert(f2->mantissa!=0);   // i don't handle this case, but also shouldn't happen -- zero is handled as a special case
	f2->mantissa--;  
	if (f2->mantissa==0) {
		f2->exp--;
		f2->mantissa=1;
	}
}

/**************************************************/
/**************************************************/
/**************************************************/

/* create a bigint fraction equal to passed float2 with a denominator that is a power of 2 */

void frac2_new(struct frac2* f2, struct float2* df) {
	twr_big_assign64u(&f2->num, df->mantissa);

	if (df->exp-52 < 0)  {
		f2->denexp=-(df->exp - 52);
	}
	else {
		twr_big_shiftleft_bits(&f2->num, df->exp-52);  
		f2->denexp=0;
	}

	frac2_simplify(f2);
}

void frac2_simplify(struct frac2* f2) {
	if (twr_big_iszero(&f2->num)) {
		f2->denexp=0;
		return;
	}
	while(f2->denexp>0) {
		const uint32_t num0=f2->num.word[0];
		if (num0&1) return;
		twr_big_shiftright_onebit(&f2->num);
		f2->denexp--;
	}
}

void frac2_getden(struct frac2* f2, struct twr_bigint* den) {
	twr_big_2pow(den, f2->denexp);  
}

int frac2_10log(struct frac2* f2) {
	struct twr_bigint frac2den;
	frac2_getden(f2, &frac2den);
	return twr_big_10log(&f2->num, &frac2den);  
}

/* digits = int( f2*10^(-shift10) )  */
/* eg: f2=.012, shift10=-3, digits_out is set to 12 */
/* eg. f2=10, shift=1, digits_out is set to 1 */
/* if doround==true, will use +0.5 rounding */
/* returns 0, or 1 if rounding increased length of digits_out */
/* e.g 0.999, shift10=-1, doround=1, returns digits_out of 10 (instead of 9 w/o rounding) */
int frac2_get_digits(struct frac2* f2, struct twr_bigint * digits_out,  int shift10, int doround) {
	int retval=0;

	if (shift10 <= 0) {
		struct twr_bigint powval;
		int overflow=twr_big_10pow(&powval, -shift10);assert(!overflow);
		overflow=twr_big_mult(digits_out, &f2->num, &powval);assert(!overflow);
		twr_big_shiftright_bits(digits_out, f2->denexp);

		if (doround) {
			struct twr_bigint rd, do10;
			int overflow=twr_big_mult32u(&powval, &powval, 10);assert(!overflow);
			overflow=twr_big_mult(&rd, &f2->num, &powval);assert(!overflow);
			twr_big_shiftright_bits(&rd, f2->denexp);

			overflow=twr_big_mult32u(&do10, digits_out, 10);assert(!overflow);
			twr_big_sub(&rd, &rd, &do10);
			assert(twr_big_isint32u(&rd));
			int round_digit=twr_big_get32u(&rd);
			if (round_digit>=5) {
				uint32_t preround=twr_big_num10digits(digits_out);
				twr_big_add32u(digits_out, digits_out, 1);
				retval=twr_big_num10digits(digits_out)-preround; // eg.  999 goes to 1000
			}
		}
	}
	else {
		struct twr_bigint den, denr;
		int overflow=twr_big_10pow(&denr, shift10-1);assert(!overflow);
		overflow=twr_big_mult32u(&den, &denr, 10);assert(!overflow);
		twr_big_shiftleft_bits(&den, f2->denexp);
		twr_big_div(digits_out, 0, &f2->num, &den);  // digits_out = num/(powval*2^denexp)

		if (doround) {
			struct twr_bigint rd, do10;
			twr_big_shiftleft_bits(&denr, f2->denexp);
			twr_big_div(&rd, 0, &f2->num, &denr);  

			int overflow=twr_big_mult32u(&do10, digits_out, 10);assert(!overflow);
			twr_big_sub(&rd, &rd, &do10);
			assert(twr_big_isint32u(&rd));
			int round_digit=twr_big_get32u(&rd);
			if (round_digit>=5) {
				uint32_t preround=twr_big_num10digits(digits_out);
				twr_big_add32u(digits_out, digits_out, 1);
				retval=twr_big_num10digits(digits_out)-preround; // eg.  999 goes to 1000
			}
		}

	}

	return retval;
}

/* digit = int( f2*10^(-shift10) )-digitstosub */
uint32_t frac2_get_single_digit(struct frac2* f2, struct twr_bigint * digitstosub, int shift10) {
	struct twr_bigint digits;

	frac2_get_digits(f2, &digits, shift10, 0);
	twr_big_sub(&digits, &digits, digitstosub);
	assert(twr_big_isint32u(&digits));
	uint32_t digit=twr_big_get32u(&digits);

	return digit;
}

/**************************************************/
/**************************************************/
/**************************************************/

/* create a bigint fraction where the base is a power of 10 */

void frac10_new(struct frac10* f10, struct frac2* f2) {
	if (f2->denexp==0) {
		f10->num=f2->num;
		f10->denexp=0;
		return;
	}

	f10->denexp=f2->denexp;

	/* multiply numerator by 5 (for each 2 in base) will convert it from base 2 to base 10 */
	struct twr_bigint pow5;
	int overflow=twr_big_5pow(&pow5, f2->denexp);assert(!overflow);
	overflow=twr_big_mult(&f10->num, &f2->num, &pow5);assert(!overflow);
	frac10_simplify(f10);
}

void frac10_simplify(struct frac10* f10) {
	struct twr_bigint ten;
	twr_big_assign32u(&ten, 10);

	while (f10->denexp>0) {
		const uint32_t num0=f10->num.word[0];
		struct twr_bigint q,r;

		if (num0&1) return;  /* optimization - a number divisible 10 is also divisible by 2 */
		twr_big_div(&q, &r, &f10->num, &ten);
		if (!twr_big_iszero(&r)) return;  /* not divisible by 10 if there is a remainder */
		twr_big_assign(&f10->num, &q);
		f10->denexp--;
	}
}

/*  returns number of zeros removed */
unsigned int twr_big_remove_trailing_zeros(struct twr_bigint *big) {
	unsigned int exp=0;
	struct twr_bigint ten;
	twr_big_assign32u(&ten, 10);

	if (twr_big_iszero(big))
		return 0;

	while (1) {
		const uint32_t w0=big->word[0];
		struct twr_bigint q,r;

		if (w0&1) return exp;  /* optimization - a number divisible 10 is also divisible by 2 */
		twr_big_div(&q, &r, big, &ten);
		if (!twr_big_iszero(&r)) return exp;  /* not divisible by 10 if there is a remainder */
		twr_big_assign(big, &q);
		exp++;
	}
}


void frac10_getden(struct frac10* f10, struct twr_bigint* den) {
	int overflow=twr_big_10pow(den, f10->denexp);  
	assert(!overflow);
}

/* adjust denominators to all be the same without loosing precision */
void frac10_match_den(struct frac10* a, struct frac10* b, struct frac10* c) {
	unsigned int m=a->denexp;
	if (b->denexp>m) m=b->denexp;
	if (c->denexp>m) m=c->denexp;
	frac10_adjust_den(a, m);
	frac10_adjust_den(b, m);
	frac10_adjust_den(c, m);
}

/* adjust a denominator to a new power of 10 */
/* precision will/may be lost if the denominator value is reduced to a smaller power of 10 */ 
void frac10_adjust_den(struct frac10* f10, int inewden) {
	assert(inewden>=0);
	unsigned int newden=(unsigned int)inewden;
	if (newden > f10->denexp) {
		int d=newden-f10->denexp;
		f10->denexp=newden;
		struct twr_bigint p;
		int overflow=twr_big_10pow(&p, d); assert(!overflow);
		overflow=twr_big_mult(&f10->num, &f10->num, &p);assert(!overflow);
	}
	else if (f10->denexp > newden) {
		int d=f10->denexp - newden;
		f10->denexp=newden;
		struct twr_bigint p;
		int overflow=twr_big_10pow(&p, d); assert(!overflow);
		twr_big_div(&f10->num, 0, &f10->num, &p);
	}
}

/* round to the passed num of significant digits.  
 * Eg. 123 round 1 becomes 100 (1 expden -2)
 * Eg. 0.123 round 1 becomes 0.1  (1 expden 1)
 * 
 * returns the number of digits that were set to zero.  If no digits were set to zero,
 * returns a negative number, indicating how many decimal places (or zeros) short of requested sig digits. 
 */

int frac10_round_b(struct frac10* f10, int new_num_sig_digits) {
	assert(new_num_sig_digits>0);  // seems to work with 0, will round MSD.  Ie, 9 returns 1, 4 returns 0. 
	int existing_digits=twr_big_num10digits(&f10->num);
	int chop=existing_digits-new_num_sig_digits;

	if (chop>0) {
		frac10_round_a(f10, chop);
	}
	return chop;
}

void frac10_round_a(struct frac10* f10, int chop) {
	assert(chop>=0);
	if (chop>0) {
		struct twr_bigint divisor, five;
		twr_big_assign32u(&five, 5);
		int overflow=twr_big_10pow(&divisor, chop-1);	assert(!overflow);
		overflow=twr_big_mult(&five, &five, &divisor);assert(!overflow);
		overflow=twr_big_mult32u(&divisor, &divisor, 10);assert(!overflow);
		overflow=twr_big_add(&f10->num, &f10->num, &five);assert(!overflow);
		twr_big_div(&f10->num, 0, &f10->num, &divisor);
		int i=f10->denexp-chop;
		if (i>=0)
			f10->denexp=i;
		else {
			int overflow=twr_big_10pow(&divisor, -i);assert(!overflow);
			overflow=twr_big_mult(&f10->num, &f10->num, &divisor);assert(!overflow);
			f10->denexp=0;
		}
		frac10_simplify(f10);
	}
}

int frac10_10log(struct frac10 *f10) {
	struct twr_bigint one;
	twr_big_assign32u(&one, 1);

	int n=twr_big_10log(&f10->num, &one);
	if (n==BIGINT_LOG_OFZERO_ERROR) return n; 

	return n-f10->denexp;
}

/**************************************************/
/**************************************************/
/**************************************************/

int numdigits2(uint64_t n) {
/**
	int count = 0; 
	while (n) { 
		n=n>>1;
		++count; 
	}
	return count;
**/

return 64 - __builtin_clzll(n);
}

#if 0
.intel_syntax noprefix
    .globl  main
main:
    mov rdi, 1000000000000              #;your value here
    bsr rax, rdi
    movzx   eax, BYTE PTR maxdigits[1+rax]
    cmp rdi, QWORD PTR powers[0+eax*8]
    sbb al, 0
    ret
maxdigits:
    .byte   0
    .byte   0
    .byte   0
    .byte   0
    .byte   1
    .byte   1
    .byte   1
    .byte   2
    .byte   2
    .byte   2
    .byte   3
    .byte   3
    .byte   3
    .byte   3
    .byte   4
    .byte   4
    .byte   4
    .byte   5
    .byte   5
    .byte   5
    .byte   6
    .byte   6
    .byte   6
    .byte   6
    .byte   7
    .byte   7
    .byte   7
    .byte   8
    .byte   8
    .byte   8
    .byte   9
    .byte   9
    .byte   9
    .byte   9
    .byte   10
    .byte   10
    .byte   10
    .byte   11
    .byte   11
    .byte   11
    .byte   12
powers:
    .quad   0
    .quad   10
    .quad   100
    .quad   1000
    .quad   10000
    .quad   100000
    .quad   1000000
    .quad   10000000
    .quad   100000000
    .quad   1000000000
    .quad   10000000000
    .quad   100000000000
    .quad   1000000000000
#endif

/**************************************************/
/**************************************************/
/**************************************************/

/* result = multiplicand*10^exp, exp>0  */
int multiexp10(struct twr_bigint *result, struct twr_bigint *multiplicand, int exp) {
	struct twr_bigint multiplier;
	if (exp <0) {
		twr_big_bzero(result);
	}
	int overflow=twr_big_10pow(&multiplier, exp);assert(!overflow);
	if (twr_big_mult(result, multiplicand, &multiplier)) return 1;
	return 0;
}

/**************************************************/
/**************************************************/
/**************************************************/

void nstrcopy(char *buffer, const int sizeInBytes, const char *outstring, const int sizeofoutstring, int n) {
	if (n>0) {
		if (n>sizeofoutstring) n = sizeofoutstring;
		if (n>sizeInBytes-1) n=sizeInBytes-1;
		twr_strncpy(buffer, outstring, n);
	}
	if (n>=0) buffer[n]=0;
	else if (sizeInBytes>0) buffer[0]=0;
}

#if 0
/**************************************************/
/**************************************************/
/**************************************************/

// float54 value := (mantissa/2^54) * 2^firstdigitpos
// unlike a 52 bit ieee mantissa, this one includes the "silent 1" and one extra bit for rounding

struct float54 {
	uint64_t mantissa;	/* never zero */
	int firstdigitpos;	/* exponent */
	int mantissa_size;   /* number of sig bits in mantissa */
}

f54_new(struct float54 * f54, uint64_t mantissa, int mantissa_size, int firstdigitpos ) {
	f54->firstdigitpos=firstdigitpos;
	f54->mantissa=mantissa;
	f54->mantissa_size=mantissa_size;
}

/*
 * reduce mantissa to a ieee 52 bit mantissas and round in the process 
 * leading 1 still retained on normalized numbers
 * mantissa_size will be 53 for a normalized number, and less than 53 for denormalized
 */
f54_ieee_round(struct float54 * f54) {
	assert(f54->mantissa_size==54);
	if (f54->firstdigitpos < -1022) {    /** is de-nomralized double? */
		const int shift=-(f54->firstdigitpos+1022);
		f54->mantissa=f54->mantissa>>shift;   /* shift out bits lost in ieee representation,  except round bit */
		f54->mantissa_size-=shift;
		int round=f54->mantissa&1;
		f54->mantissa=f54->mantissa>>1;
		f54->mantissa_size--;
		f54->mantissa=f54->mantissa+round;  /* this could flip the denomralized value into a normalized value */
		int n=numdigits2(f54->mantissa);
		assert(n<=53);
		if (n==53) {
			f54->firstdigitpos++;
			assert(f54->firstdigitpos==-1022);
		}
	}
	else { /* normalized double */
		assert(f54->mantissa_size==54);
		int round=f54->mantissa&1;
		f54->mantissa=f54->mantissa>>1;
		f54->mantissa_size--;
		f54->mantissa=f54->mantissa+round;  /* this could increase the bit-size of the mantissa  */
		int n=numdigits2(f54->mantissa);
		assert(n<=54);   /* 54 if rouding added a digit */
		if (n==54) {
			f54->firstdigitpos++;
			f54->mantissa=f54->mantissa>>1;
		}
	}
}

#endif

int twr_float_unit_test() {
	struct frac2 frac2;
	struct frac10 frac10;
	struct float2 flt2;
	struct floatieee fie;

/** test fract2 - independently */
	twr_big_assign64u(&frac2.num, 1ULL<<32);
	frac2.denexp=32;
	frac2_simplify(&frac2);
	if (!twr_big_isequal32u(&frac2.num, 1) || frac2.denexp!=0) return 0;

/** test fract10 with frac2 */
	frac10_new(&frac10, &frac2);
	if (!twr_big_isequal32u(&frac10.num, 1) || frac10.denexp!=0) return 0;

	twr_big_assign64u(&frac2.num, 800);
	frac2.denexp=3;
	frac10_new(&frac10, &frac2);  // 100
	if (!twr_big_isequal32u(&frac10.num, 100) || frac10.denexp!=0) return 0;

/** test fract10 simplify  */
	twr_big_assign64u(&frac10.num, 1200);
	frac10.denexp=0;
	frac10_simplify(&frac10);
	if (!twr_big_isequal32u(&frac10.num, 1200) || frac10.denexp!=0) return 0;

	twr_big_assign64u(&frac10.num, 1200);
	frac10.denexp=2;
	frac10_simplify(&frac10);
	if (!twr_big_isequal32u(&frac10.num, 12) || frac10.denexp!=0) return 0;

/* test floatieee */
	flt2.mantissa=(1ULL)<<53;
	flt2.exp=2000;
	flt2.sign=0;
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (!twr_isinf(fie.doubleval)) return 0;
	if (fie.isdenormal ||!fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	flt2.mantissa=(1ULL)<<54;
	flt2.exp=0;
	flt2.sign=0;
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=4.0) return 0;
	if (fie.isdenormal ||fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	flt2.mantissa=(1ULL)<<51;
	flt2.exp=0;
	flt2.sign=0;
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=0.5) return 0;
	if (fie.isdenormal ||fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	floatieee_new(&fie, .5);
	float2_new(&flt2, &fie);
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=0.5) return 0;
	if (fie.isdenormal ||fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	floatieee_new(&fie, twr_infval());
	float2_new(&flt2, &fie);
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (!twr_isinf(fie.doubleval)) return 0;
	if (fie.isdenormal ||!fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	floatieee_new(&fie, -1.1);
	float2_new(&flt2, &fie);
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=-1.1) return 0;
	if (fie.isdenormal || fie.isinf || fie.isnan || fie.iszero || fie.sign==0) return 0;

/*	1.1125369292536006915451163586662e-308 is 2pow(2,-1023) first denomralized number */
	floatieee_new(&fie, 1.1125369292536006915451163586662e-308);
	float2_new(&flt2, &fie);
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=1.1125369292536006915451163586662e-308) return 0;
	if (!fie.isdenormal || fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	floatieee_new(&fie, 3.6e-310);
	float2_new(&flt2, &fie);
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=3.6e-310) return 0;
	if (!fie.isdenormal ||fie.isinf || fie.isnan || fie.iszero || fie.sign==1) return 0;

	floatieee_new(&fie, 0.0);
	float2_new(&flt2, &fie);
	floatieee_bzero(&fie);
	floatieee_from_float2(&fie, &flt2);
	if (fie.doubleval!=0.0) return 0;
	if (fie.isinf || fie.isnan || !fie.iszero) return 0;

/* test double->ieee->float2->frac2 new */
	floatieee_new(&fie, 0.5);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	if (!twr_big_isequal32u(&frac2.num, 1) && frac2.denexp==1) return 0;

	floatieee_new(&fie, 0);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	if (!twr_big_isequal32u(&frac2.num, 0) && frac2.denexp==0) return 0;

	floatieee_new(&fie, 2.5);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	if (!twr_big_isequal32u(&frac2.num, 5) && frac2.denexp==1) return 0;

/* test frac10 rounding */
	struct frac10 f10;

	twr_big_assign32u(&f10.num, 1);
	f10.denexp=0;
	frac10_round_b(&f10, 1);
	if (!twr_big_isequal32u(&f10.num,1) || f10.denexp!=0) return 0;

	twr_big_assign32u(&f10.num, 154);
	f10.denexp=0;
	frac10_round_b(&f10, 1);
	if (!twr_big_isequal32u(&f10.num,200) || f10.denexp!=0) return 0;

	twr_big_assign32u(&f10.num, 150);
	f10.denexp=0;  //150
	frac10_round_b(&f10, 2);
	if (!twr_big_isequal32u(&f10.num,150) || f10.denexp!=0) return 0;

	twr_big_assign32u(&f10.num, 154);
	f10.denexp=3;  //0.154
	frac10_round_b(&f10, 1);
	if (!twr_big_isequal32u(&f10.num, 2) || f10.denexp!=1) return 0;

	//frac10 frac10_match_den
	struct frac10 a,b,c;

	a.denexp=0;
	twr_big_assign32u(&a.num,10);
	b.denexp=0;
	twr_big_assign32u(&a.num,100);
	c.denexp=0;
	twr_big_assign32u(&a.num,1000);
	frac10_match_den(&a, &b, &c);
	if (a.denexp!=0 && b.denexp!=0 && c.denexp!=0) return 0;

	a.denexp=1;
	twr_big_assign32u(&a.num,1);
	b.denexp=2;
	twr_big_assign32u(&b.num,11);
	c.denexp=3;
	twr_big_assign32u(&c.num,111);
	frac10_match_den(&a, &b, &c);
	if (a.denexp!=3 && b.denexp!=3 && c.denexp!=3) return 0;
	if (!twr_big_isequal32u(&a.num, 100)) return 0;
	if (!twr_big_isequal32u(&b.num, 110)) return 0;
	if (!twr_big_isequal32u(&c.num, 111)) return 0;

/* test frac2_get_digits */
	struct twr_bigint digits;

	floatieee_new(&fie, 0.9999);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	int up=frac2_get_digits(&frac2, &digits, -1, 0);
	if (!twr_big_isequal32u(&digits, 9)) return 0;
	if (up!=0) return 0;

	floatieee_new(&fie, 0.9999);
	float2_new(&flt2, &fie);
	up=frac2_get_digits(&frac2, &digits, -1, 1);
	if (!twr_big_isequal32u(&digits, 10)) return 0;
	if (up!=1) return 0;

	floatieee_new(&fie,  0.145);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	up=frac2_get_digits(&frac2, &digits, -4, 0);
	if (!twr_big_isequal32u(&digits, 1449)) return 0;
	if (up!=0) return 0;

	floatieee_new(&fie,  0.145);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	up=frac2_get_digits(&frac2, &digits, -4, 1);
	if (!twr_big_isequal32u(&digits, 1450)) return 0;
	if (up!=0) return 0;

	floatieee_new(&fie,  10);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	up=frac2_get_digits(&frac2, &digits, 1, 1);
	if (!twr_big_isequal32u(&digits, 1)) return 0;
	if (up!=0) return 0;

	floatieee_new(&fie,  105);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	up=frac2_get_digits(&frac2, &digits, 1, 1);
	if (!twr_big_isequal32u(&digits, 11)) return 0;
	if (up!=0) return 0;

	floatieee_new(&fie,  99.99);
	float2_new(&flt2, &fie);
	frac2_new(&frac2, &flt2);
	up=frac2_get_digits(&frac2, &digits, 0, 1);
	if (!twr_big_isequal32u(&digits, 100)) return 0;
	if (up!=1) return 0;

	return 1;
}
