/* Copyright 2023 Anthony J. Wood */
/* Okay to use under MIT license */

/* except div code is Knuth's Algorithm D from Hacker's Delight */

#include "twr-bigint.h"
#include <assert.h>
#include <stddef.h>

#define max(x, y) ((x) > (y) ? (x) : (y))

unsigned int twr_big_get_length(struct twr_bigint * big) {
	return big->len;
}

uint32_t twr_big_get_word(struct twr_bigint * big, unsigned int n) {
	if ( n >= big->len ) return 0;
	else return big->word[n];
}

void twr_big_bzero(struct twr_bigint * big) {
	big->len=1;
	big->word[0]=0;
}

void twr_big_bzero_long(struct twr_bigint * big, unsigned int len) {
	assert(len<=BIG_INT_WORD_COUNT);
	for (unsigned int i=0; i<len; i++)
		big->word[i]=0;
	big->len=len;
}

void twr_big_bmax(struct twr_bigint * big) {
	for (int i=0; i<BIG_INT_WORD_COUNT; i++)
		big->word[i]=UINT32_MAX;
	big->len=BIG_INT_WORD_COUNT;
}

int twr_big_iszero(struct twr_bigint * big) {
	for (unsigned int i=0; i<big->len; i++)
		if (big->word[i]) return 0;

	return 1;
}

int twr_big_isequal(struct twr_bigint * big1, struct twr_bigint * big2) {
	unsigned int len=max(big1->len, big2->len);
	for (unsigned int i=0; i<len; i++) {
		const uint32_t a=twr_big_get_word(big1, i);
		const uint32_t b=twr_big_get_word(big2, i);
		if (a!=b) return 0;
	}

	return 1;
}

int twr_big_isequal32u(struct twr_bigint * big, uint32_t i32) {
	if (big->word[0]==i32 && big->len==1) return 1;
	else return 0;
}

/* big1 >= big2 */
int twr_big_isgteq(struct twr_bigint * big1, struct twr_bigint * big2) {
	int len=max(big1->len, big2->len);
	for (int i=len-1; i>=0; i--) {
		const uint32_t a=twr_big_get_word(big1, i);
		const uint32_t b=twr_big_get_word(big2, i);
		if (a==b) continue;
		if (a>b) return 1; else return 0;
	}

	return 1;
}

int twr_big_isgt(struct twr_bigint * big1, struct twr_bigint * big2) {
	int len=max(big1->len, big2->len);

	for (int i=len-1; i>=0; i--) {
		const uint32_t a=twr_big_get_word(big1, i);
		const uint32_t b=twr_big_get_word(big2, i);
		if (a==b) continue;
		if (a > b) return 1; else return 0;
	}

	return 0;
}

/* big1 <= big2 */
int twr_big_islteq(struct twr_bigint* big1, struct twr_bigint* big2) {
	return twr_big_isgteq(big2, big1);
}

int twr_big_islt(struct twr_bigint* big1, struct twr_bigint* big2) {
	return twr_big_isgt(big2, big1);
}

/* return 1 if overflow; otherwise 0 */
int twr_big_2pow(struct twr_bigint * big, int exp) {
	assert(exp>=0);
	if (exp >=  (int)(BIG_INT_WORD_COUNT*32)) return 1;
	const unsigned int word=exp/32;
	twr_big_bzero_long(big, word+1);
	big->word[word]=1<<(exp%32);

	return 0;
}

void twr_big_assign32u(struct twr_bigint* big, uint32_t ui) {
	big->len=1;
	big->word[0]=ui;
}

void twr_big_assign64u(struct twr_bigint* big, uint64_t ui) {
	big->len=2;
	big->word[0]=ui&0xFFFFFFFF;
	big->word[1]=ui>>32;
	if (big->word[1]==0) big->len--;
}

/** 128bit is uh<<64 | ul **/
void twr_big_assign128u(struct twr_bigint* big, uint64_t uh, uint64_t ul) {
	big->len=4;
	big->word[0]=ul&0xFFFFFFFF;
	big->word[1]=ul>>32;
	big->word[2]=uh&0xFFFFFFFF;
	big->word[3]=uh>>32;

	if (big->word[3]==0) {
		big->len--;
		if (big->word[2]==0) {
			big->len--;
			if (big->word[1]==0) {
				big->len--;
			}
		}
	}
}

void twr_big_assign(struct twr_bigint* dest, struct twr_bigint* source) {
	assert(source->len<=BIG_INT_WORD_COUNT);
	for (unsigned int i=0; i<source->len; i++)
		dest->word[i]=source->word[i];
	dest->len=source->len;
}

struct twr_bigint* twr_big_min(struct twr_bigint* a, struct twr_bigint* b)
{
	if (twr_big_isgt(a, b)) return b; else return a;
}

struct twr_bigint* twr_big_max(struct twr_bigint* a, struct twr_bigint* b)
{
	if (twr_big_isgt(a, b)) return a; else return b;
}

int twr_big_mult32u(struct twr_bigint * product, struct twr_bigint * multiplicand, uint32_t multipler) {

	uint32_t i, carry=0;

	for (i=0; i<multiplicand->len; i++) {
		uint64_t partialprodcut=(uint64_t)multipler*multiplicand->word[i];
		partialprodcut+=carry;
		product->word[i]=partialprodcut&0xFFFFFFFF;
		carry=partialprodcut>>32;
	}	

	if (carry) {
		if (multiplicand->len < BIG_INT_WORD_COUNT) {
			product->word[i]=carry;
			i++;
			carry=0;
		}
	}

	product->len=i;
	return carry;
}

/*returns 0 if no error, 1 if overflow */

int twr_big_pow(struct twr_bigint * big, unsigned int base, int exp) {
	assert(exp>=0);
	if (base==10)
		return twr_big_10pow(big, exp);
	else {
		twr_big_assign32u(big, 1);
		while (exp--)
			if (twr_big_mult32u(big, big, base)) return 1;

		return 0;
	}
}

static uint32_t pow10_u32(uint32_t n) {
	assert(n<10);
	switch (n) {
		case 0:
			return 1;
		case 1:
			return 10;
		case 2:
			return 100;
		case 3:
			return 1000;
		case 4:
			return 10000;
		case 5:
			return 100000;
		case 6:
			return 1000000;
		case 7:
			return 10000000;
		case 8:
			return 100000000;
		case 9:
			return 1000000000;
		default:
			assert(0);	
			return 0;
	}
}

static uint32_t pow5_u32(uint32_t n) {
	assert(n<10);
	switch (n) {
		case 0:
			return 1;
		case 1:
			return 5;
		case 2:
			return 25;
		case 3:
			return 125;
		case 4:
			return 625;
		case 5:
			return 3125;
		case 6:
			return 15625;
		case 7:
			return 78125;
		case 8:
			return 390625;
		case 9:
			return 1953125;
		default:
			assert(0);	
			return 0;
	}
}

int twr_big_10pow(struct twr_bigint * big, int exp) {
	assert(exp>=0);

	if (exp<10) {
		twr_big_assign32u(big, pow10_u32(exp));
		return 0;
	}

	int n=exp/9;
	int left=exp-n*9;
	twr_big_assign32u(big, 1);

	while (n--)
		if (twr_big_mult32u(big, big, 1000000000)) return 1;

	assert(left<9);
	if (twr_big_mult32u(big, big, pow10_u32(left))) return 1;

	return 0;
}

int twr_big_5pow(struct twr_bigint * big, int exp) {
	assert(exp>=0);

	if (exp<10) {
		twr_big_assign64u(big, pow5_u32(exp));
		return 0;
	}

	int n=exp/10;
	int left=exp-n*10;
	twr_big_assign32u(big, 1);

	while (n--)
		if (twr_big_mult32u(big, big, 9765625)) return 1;

	assert(left<10);
	if (twr_big_mult32u(big, big, pow5_u32(left))) return 1;

	return 0;
}

/** 0 if no error; 1 if bit(s) lost  (words shifted out of end) **/
int twr_big_shiftleft_words(struct twr_bigint * big, unsigned int n) {

	if (n==0) return 0;

	if (n>=BIG_INT_WORD_COUNT) {
		twr_big_bzero(big);
		return 1;
	}

	int lostbits = ( n+big->len > BIG_INT_WORD_COUNT );
	if (lostbits) {
		big->len=BIG_INT_WORD_COUNT;
	}
	else {
		big->len+=n;
	}

	assert(big->len<=BIG_INT_WORD_COUNT);
	assert(n<BIG_INT_WORD_COUNT);

	unsigned int move=big->len-n;
	assert (move >= 1 && move < big->len);

	int dest=big->len-1;
	int src=dest-n;

/** these are words that didn't get touched below because they would be moved outside  **/
/** a non zero word here means bits were lost in the shift **/
	for (int i=src+1; i<dest; i++) {
		// if (big->word[i]!=0) lostbits=1; unused storage due to big->len
		big->word[i]=0;
	}

	//for (unsigned int i=0; i < n; i++)
	//	if (big->word[BIG_INT_WORD_COUNT-1-i]!=0) lostbits=1;  not needed due to big->maxlen

	while (move--) {
		big->word[dest--]=big->word[src];
		big->word[src--]=0;
	}

	assert(src==-1);

	return lostbits;
}

/** 0 if no error; 1 if bit(s) lost  (non-zero words shift out end) **/
int twr_big_shiftright_words(struct twr_bigint * big, unsigned int n) {
	if (n==0) return 0;

	int lostbits = ( n >= big->len );
	if (lostbits) {
		lostbits=!twr_big_iszero(big);
		twr_big_bzero(big);
		return lostbits;
	}

	assert(n < big->len);

	int move=big->len-n;
	assert (move >= 1 && move < BIG_INT_WORD_COUNT);

	int dest=0;
	int src=n;
	/** these are words that didn't get touched below beacuse they would be moved outside  **/
	/** a non zero word here means bits were lost in the shift **/
	for (int i=dest+move; i<=(src-1); i++) {
		if (big->word[i]!=0) lostbits=1;
		// big->word[i]=0;
	}

	for (unsigned int i=0; i < n; i++)
		if (big->word[i]!=0) lostbits=1;

/* move words */
	while (move--) {
		big->word[dest++]=big->word[src++];
		//big->word[src++]=0;
	}

	assert((unsigned int)src==big->len);

	big->len=big->len-n;

	return lostbits;
}


int twr_big_shiftleft_onebit(struct twr_bigint * big) {
	int carry=0;

	for (unsigned int i=0; i<big->len; i++) {
		int t=big->word[i]&(1<<31);
		big->word[i]<<=1;
		if (carry) big->word[i]|=1;
		carry=t;
	}

	if (carry) {
		if (big->len<BIG_INT_WORD_COUNT) {
			big->word[big->len]=1;
			big->len++;
			return 0;
		}
	}

	return carry;
}

/* returns 1 if bit lost */
int twr_big_shiftright_onebit(struct twr_bigint * big) {
	int carry;
	int bitzero=big->word[0]&1;
	for (unsigned int i=0; i<big->len-1; i++) {
		carry=big->word[i+1]&1;
		big->word[i]>>=1;
		if (carry) big->word[i]|=(1<<31);
	}
	big->word[big->len-1]>>=1;
	if (big->word[big->len-1]==0 && big->len>1)
		big->len--;

	return bitzero;
}

int twr_big_shiftleft_bits(struct twr_bigint * bi, unsigned int n) {
	int lostbits;
	lostbits=twr_big_shiftleft_words(bi, n/32);
	for (unsigned int i=0; i < (n%32); i++)
		lostbits=lostbits|twr_big_shiftleft_onebit(bi);

	return lostbits;
}

int twr_big_shiftright_bits(struct twr_bigint * bi, unsigned int n) {
	int lostbits;
	lostbits=twr_big_shiftright_words(bi, n/32);
	for (unsigned int i=0; i < (n%32); i++)
		lostbits=lostbits|twr_big_shiftright_onebit(bi);

	return lostbits;
}

void twr_big_set_bit(struct twr_bigint * big, const unsigned int bitnum, const unsigned int val) {
	assert(bitnum/32 < BIG_INT_WORD_COUNT);

	if (val)
		big->word[bitnum/32]|=(1<<(bitnum%32));
	else
		big->word[bitnum/32]&=(~(1<<(bitnum%32)));

	if (bitnum/32 >= big->len)
		big->len=bitnum/32+1;
}

int twr_big_get_bit(struct twr_bigint * big, unsigned int bitnum) {
	if (bitnum/32 >= big->len) return 0;
	if (big->word[bitnum/32]&(1<<(bitnum%32)))
		return 1;
	else
		return 0;
}

int twr_big_add(struct twr_bigint * sum, struct twr_bigint * addend1, struct twr_bigint * addend2) {
	uint32_t carry=0, tc, s;

	unsigned int i, len = max(addend1->len, addend2->len);

	for (i=0; i<len; i++) {
		const uint32_t a=twr_big_get_word(addend1, i);
		const uint32_t b=twr_big_get_word(addend2, i);

		s=a+b;
		if ( s < a ) tc=1; else tc=0;  /* overflow? */

		s=s+carry;
		if (s<carry || tc==1) carry=1; else carry=0;   /* overflow? */

		sum->word[i]=s;
	}

	if (carry) {
		if (len < BIG_INT_WORD_COUNT) {
			sum->word[i]=carry;
			i++;
			carry=0;
		}
	}

	sum->len=i;

	// shrink if results have leading zeros (if a subtract, or rolled over)
	for (int i=(int)sum->len-1; i>0; i--) 
		if (sum->word[i]==0) 
			sum->len--;
		else
			break;

	return carry;
}


int twr_big_add32u(struct twr_bigint * sum, struct twr_bigint *addend1 , uint32_t b) {
	uint32_t i, carry, s;

	const uint32_t a=addend1->word[0];
	s=a+b;
	if ( s < a ) carry=1; else carry=0;  	/* overflow? */
	sum->word[0]=s;

	for (i=1; i<addend1->len; i++) {
		const uint32_t a=addend1->word[i];
		s=a+carry;
		if (s<carry) carry=1; else carry=0;   /* overflow? */
		sum->word[i]=s;
	}

	if (carry) {
		if (addend1->len < BIG_INT_WORD_COUNT) {
			sum->word[i]=carry;
			i++;
			carry=0;
		}
	}

	sum->len=i;

	// shrink if results have leading zeros (if rolled over)
	for (int i=(int)sum->len-1; i>0; i--) 
		if (sum->word[i]==0) 
			sum->len--;
		else
			break;

	return carry;
}

void twr_big_complement(struct twr_bigint * result, struct twr_bigint * in) {
	for (unsigned int i=0; i<in->len; i++) 
		result->word[i]=~(in->word[i]);
	for (unsigned int i=in->len; i<BIG_INT_WORD_COUNT; i++) 
		result->word[i]=~(0);
	result->len=BIG_INT_WORD_COUNT;
}

/* r = a - b */
void twr_big_sub(struct twr_bigint * r, struct twr_bigint * a, struct twr_bigint * b) {
	struct twr_bigint twos;
	twr_big_complement(&twos, b);
	twr_big_add32u(&twos, &twos, 1);
	
	twr_big_add(r, a, &twos);

/**

	uint64_t borrow=0;
	uint64_t newborrowa, newborrowb;

	for (int i=0; i<BIG_INT_WORD_COUNT; i++) {
		if ((uint64_t)a->word[i] >= (uint64_t)b->word[i] + borrow) {
			newborrowa=0;
			newborrowb=0;

		}
		else {
			newborrowa=1+UINT32_MAX;
			newborrowb=1;
		}
			
		r->word[i]=(uint64_t)(a->word[i]) + newborrowa - borrow - (uint64_t)(b->word[i]);

		borrow=newborrowb;
	}	

	return borrow;

**/

}

/* returns error num; 0 no error.  1 overflow. */

int twr_big_mult(struct twr_bigint * product, struct twr_bigint * multiplicand, struct twr_bigint * multipler) {
	struct twr_bigint t;
	struct twr_bigint tps;
	struct twr_bigint *tp;

	if (product==multiplicand || product==multipler)
		tp=&tps;
	else
		tp=product;

	twr_big_bzero(tp);

	for (unsigned int i=0; i<multipler->len; i++) {
		if (twr_big_mult32u(&t, multiplicand, multipler->word[i])) return 1;
		if (twr_big_shiftleft_words(&t, i)) return 1;
		if (twr_big_add(tp, tp, &t)) return 1;
	}

	if (tp==&tps)
		twr_big_assign(product, tp);

	return 0;
}

#if 0
void twr_big_div_slow(struct twr_bigint * q, struct twr_bigint * r, struct twr_bigint * num, struct twr_bigint * den) {
	struct twr_bigint qt;
	struct twr_bigint rt;

	if (r==NULL) r=&rt;

	twr_big_bzero(r);

	if (twr_big_iszero(den)) {
		twr_big_bmax(q);
		return;
	}

	twr_big_bzero(&qt);
	/*
	for i := n − 1 .. 0 do  -- Where n is number of bits in N
	R := R << 1           -- Left-shift R by 1 bit
	R(0) := N(i)          -- Set the least-significant bit of R equal to bit i of the numerator
	if R ≥ D then
		R := R − D
		Q(i) := 1
	end
	end
	*/

	for (int i=twr_big_get_length(num)*32-1; i>=0; i--) {
		twr_big_shiftleft_onebit(r);
		twr_big_set_bit(r, 0, twr_big_get_bit(num, i));
		if (twr_big_isgteq(r, den)) {
			twr_big_sub(r, r, den);
			twr_big_set_bit(&qt, i, 1);
		}
	}
	twr_big_assign(q, &qt);
}
#endif

/**********************************************/
/**********************************************/
/**********************************************/
/**********************************************/
/* from Hacker's Delight */
/* This divides an n-word dividend by an m-word divisor, giving an
n-m+1-word quotient and m-word remainder. The bignums are in arrays of
words. Here a "word" is 32 bits. This routine is designed for a 64-bit
machine which has a 64/64 division instruction. */


static int nlz(unsigned x) {
   int n;

   if (x == 0) return(32);
   n = 0;
   if (x <= 0x0000FFFF) {n = n +16; x = x <<16;}
   if (x <= 0x00FFFFFF) {n = n + 8; x = x << 8;}
   if (x <= 0x0FFFFFFF) {n = n + 4; x = x << 4;}
   if (x <= 0x3FFFFFFF) {n = n + 2; x = x << 2;}
   if (x <= 0x7FFFFFFF) {n = n + 1;}
   return n;
}


/* q[0], r[0], u[0], and v[0] contain the LEAST significant words.
(The sequence is in little-endian order).

This is a fairly precise implementation of Knuth's Algorithm D, for a
binary computer with base b = 2**32. The caller supplies:
   1. Space q for the quotient, m - n + 1 words (at least one).
   2. Space r for the remainder (optional), n words.
   3. The dividend u, m words, m >= 1.
   4. The divisor v, n words, n >= 2.
The most significant digit of the divisor, v[n-1], must be nonzero.  The
dividend u may have leading zeros; this just makes the algorithm take
longer and makes the quotient contain more leading zeros.  A value of
NULL may be given for the address of the remainder to signify that the
caller does not want the remainder.
   The program does not alter the input parameters u and v.
   The quotient and remainder returned may have leading zeros.  The
function itself returns a value of 0 for success and 1 for invalid
parameters (e.g., division by 0).
   For now, we must have m >= n.  Knuth's Algorithm D also requires
that the dividend be at least as long as the divisor.  (In his terms,
m >= 0 (unstated).  Therefore m+n >= n.) */

static int divmnu(uint32_t q[], uint32_t r[],
     const uint32_t u[], const uint32_t v[],
     int m, int n) {

   const unsigned long long b = 4294967296LL; // Number base (2**32).
   //unsigned *un, *vn;                         // Normalized form of u, v.
   unsigned long long qhat;                   // Estimated quotient digit.
   unsigned long long rhat;                   // A remainder.
   unsigned long long p;                      // Product of two digits.
   long long t, k;
   int s, i, j;

   if (m < n || n <= 0 || v[n-1] == 0)
      return 1;                         // Return if invalid param.

   if (n == 1) {                        // Take care of
      k = 0;                            // the case of a
      for (j = m - 1; j >= 0; j--) {    // single-digit
         q[j] = (k*b + u[j])/v[0];      // divisor here.
         k = (k*b + u[j]) - q[j]*v[0];
      }
      if (r != NULL) r[0] = k;
      return 0;
   }

   /* Normalize by shifting v left just enough so that its high-order
   bit is on, and shift u left the same amount. We may have to append a
   high-order digit on the dividend; we do that unconditionally. */

   s = nlz(v[n-1]);             // 0 <= s <= 31.
   //vn = (unsigned *)alloca(4*n);
	unsigned int vn[n];
   for (i = n - 1; i > 0; i--)
      vn[i] = (v[i] << s) | ((unsigned long long)v[i-1] >> (32-s));
   vn[0] = v[0] << s;

   //un = (unsigned *)alloca(4*(m + 1));
	unsigned int un[m+1];
   un[m] = (unsigned long long)u[m-1] >> (32-s);
   for (i = m - 1; i > 0; i--)
      un[i] = (u[i] << s) | ((unsigned long long)u[i-1] >> (32-s));
   un[0] = u[0] << s;

   for (j = m - n; j >= 0; j--) {       // Main loop.
      // Compute estimate qhat of q[j].
      qhat = (un[j+n]*b + un[j+n-1])/vn[n-1];
      rhat = (un[j+n]*b + un[j+n-1]) - qhat*vn[n-1];
again:
      if (qhat >= b || qhat*vn[n-2] > b*rhat + un[j+n-2])
      { qhat = qhat - 1;
        rhat = rhat + vn[n-1];
        if (rhat < b) goto again;
      }

      // Multiply and subtract.
      k = 0;
      for (i = 0; i < n; i++) {
         p = qhat*vn[i];
         t = un[i+j] - k - (p & 0xFFFFFFFFLL);
         un[i+j] = t;
         k = (p >> 32) - (t >> 32);
      }
      t = un[j+n] - k;
      un[j+n] = t;

      q[j] = qhat;              // Store quotient digit.
      if (t < 0) {              // If we subtracted too
         q[j] = q[j] - 1;       // much, add back.
         k = 0;
         for (i = 0; i < n; i++) {
            t = (unsigned long long)un[i+j] + vn[i] + k;
            un[i+j] = t;
            k = t >> 32;
         }
         un[j+n] = un[j+n] + k;
      }
   } // End j.
   // If the caller wants the remainder, unnormalize
   // it and pass it back.
   if (r != NULL) {
      for (i = 0; i < n-1; i++)
         r[i] = (un[i] >> s) | ((unsigned long long)un[i+1] << (32-s));
      r[n-1] = un[n-1] >> s;
   }
   return 0;
}

/* returns zero if no error */
int twr_big_div(struct twr_bigint * q, struct twr_bigint * r, struct twr_bigint * num, struct twr_bigint * den) {
 //  3. The dividend (num) u, m words, m >= 1.
//   4. The divisor (den) v, n words, n >= 2.

	const int m=num->len;
	const int n=den->len;

	struct twr_bigint *qt, qtspace;  

	if (q==num || q==den)
		qt=&qtspace;
	else qt=q;

	int error=divmnu(qt->word, r?r->word:0, num->word, den->word,  m, n);
	if (error) return 1;

   //1. Space q for the quotient, m - n + 1 words (at least one).
   //2. Space r for the remainder (optional), n words.

	qt->len=m-n+1;
	if (qt!=q) *q=*qt;

	// shrink if results have leading zeros 
	for (int i=(int)q->len-1; i>0; i--) 
		if (q->word[i]==0) 
			q->len--;
		else
			break;

	if (r) {
		r->len=n;

		for (int i=(int)r->len-1; i>0; i--) 
			if (r->word[i]==0) 
				r->len--;
			else
				break;
	}

	return 0;
}

/**************************************************************/
/**************************************************************/
/**************************************************************/


uint32_t twr_big_get32u(struct twr_bigint * big) {
		return big->word[0];
}

int twr_big_isint32u(struct twr_bigint * big) {
	return big->len==1;
}

/* returns the log (rounded to an integer) for the passed in fraction  numin/denin */
/* set denin to 1 to take the log of an integer */

int twr_big_10log(struct twr_bigint * numin, struct twr_bigint * denin) {
	int logval=0;

	if (twr_big_iszero(numin)) return BIGINT_LOG_OFZERO_ERROR;

	if (twr_big_isequal(numin, denin)) return 0;

	if (twr_big_isgteq(numin, denin)) { /* >=1 */
		struct twr_bigint den, den10;
		twr_big_assign(&den, denin);

		while (1) {
			/*
			twr_big_div(&q, &r, numin, &den); 
			if (twr_big_isint32u(&q) && (twr_big_get32u(&q)>=1 && twr_big_get32u(&q)<=9)) return logval;
			*/
			if (twr_big_mult32u(&den10, &den, 10)) return logval;
			if (twr_big_isgteq(numin, &den) && twr_big_islt(numin, &den10)) return logval;

			logval++;
			twr_big_assign(&den, &den10); 
		}
	}
	else {
		struct twr_bigint num, num10;
		twr_big_assign(&num, numin);

		while (1) {
			/*
			twr_big_div(&q, &r, &num, denin); 
			if (twr_big_isint32u(&q) && (twr_big_get32u(&q)>=1 && twr_big_get32u(&q)<=9)) {
				return -logval;
			} 
			*/

			logval++;  /* both log 0.1 and log 0.9 return -1 */
			if(twr_big_mult32u(&num10, &num, 10)) return -logval;
			if (twr_big_isgt(denin, &num) && twr_big_islteq(denin, &num10)) return -logval;
			twr_big_assign(&num, &num10);
		}
	}
}

int twr_big_2log(struct twr_bigint * numin, struct twr_bigint * denin) {
	int logval=0;

	if (twr_big_iszero(numin)) return BIGINT_LOG_OFZERO_ERROR;

	if (twr_big_isequal(numin, denin)) return 0;

	if (twr_big_isgt(numin, denin)) { /* >1 */
		struct twr_bigint den, den2;
		twr_big_assign(&den, denin);

		while (1) {
			twr_big_assign(&den2, &den);
			int carry=twr_big_shiftleft_onebit(&den2); // *2
			if (carry!=0) return logval;
			if (twr_big_isgteq(numin, &den) && twr_big_islt(numin, &den2)) return logval;			
			logval++;
			twr_big_assign(&den, &den2);
		}
	}
	else {
		struct twr_bigint num, num2;
		twr_big_assign(&num, numin);

		while (1) {
			twr_big_assign(&num2, &num);
			int carry=twr_big_shiftleft_onebit(&num2); // *2
			logval++;  
			if (carry!=0) 
				return -logval;
			if (twr_big_isgt(denin, &num) && twr_big_islteq(denin, &num2)) return -logval;
			twr_big_assign(&num, &num2);
		}
	}
}

// int log10, rounds down.  Ie, 9 return 0, 19 returns 1.
static uint32_t log10_u32(uint32_t n) {
	assert(n!=0);

	if (n < 10) return 0;
	if (n < 100) return 1;
	if (n < 1000) return 2;
	if (n < 10000) return 3;
	if (n < 100000) return 4;
	if (n < 1000000) return 5;
	if (n < 10000000) return 6;
	if (n < 100000000) return 7;
	if (n < 1000000000) return 8; // 1 Billion

	return 9;
}

static uint32_t log10_u64(uint64_t n) {
	assert(n!=0);

	if (n < 10) return 0;
	if (n < 100) return 1;
	if (n < 1000) return 2;
	if (n < 10000) return 3;
	if (n < 100000) return 4;
	if (n < 1000000) return 5;
	if (n < 10000000) return 6;
	if (n < 100000000) return 7;
	if (n < 1000000000) return 8; // 1 Billion
	if (n < 10000000000ULL) return 9; 
	if (n < 100000000000ULL) return 10; 
	if (n < 1000000000000ULL) return 11;
	if (n < 10000000000000ULL) return 12; 
	if (n < 100000000000000ULL) return 13; 
	if (n < 1000000000000000ULL) return 14; 
	if (n < 10000000000000000ULL) return 15; 
	if (n < 100000000000000000ULL) return 16; 
	if (n < 1000000000000000000ULL) return 17; 
	if (n < 10000000000000000000ULL) return 18; 

	return 19;
}

uint32_t twr_big_num10digits(struct twr_bigint * numberin) {
	if (twr_big_iszero(numberin)) return 1;

	if (twr_big_isint32u(numberin))
		return log10_u32(twr_big_get32u(numberin))+1;

	if (numberin->len==2) {
		uint64_t ui64=(((uint64_t)numberin->word[1])<<32)|numberin->word[0];
		return log10_u64(ui64)+1;
	}

	struct twr_bigint one;
	twr_big_assign32u(&one, 1);
	return twr_big_10log(numberin, &one)+1;
}

static void _strhorizflip(char * buffer, int n) {
	for (int k=0; k<n/2;k++)  {
		char t=buffer[k];
		buffer[k]=buffer[n-k-1];
		buffer[n-k-1]=t;
	}
}

int twr_big_itoa(struct twr_bigint * valuein, char * buffer, int size, int radixin) {
	int i=0;
	const char *digitchars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	struct twr_bigint value, rem, radix, den;

	if (size < 1) return 1;  /* error - buffer too small */

	if (radixin < 2 || radixin > 36)
		return 2;  /* invalid radix */

	twr_big_assign(&value, valuein);
	twr_big_assign32u(&den, 1);
	twr_big_assign32u(&radix, radixin);

/** big currently doesnt support negative numbers **/
//	if (value<0) {
//		value=-value;
//		if (size < 3) return 1;  /* error - buffer too small */
//		buffer[i++]='-';
//	}

	const int istart=i;

	while (1) {
		if (i>=(size-1)) return 1; /* error - buffer too small */
		int error=twr_big_div(&value, &rem, valuein, &den);  		// vaue=value/radix
		assert(!error);
		error=twr_big_div(&value, &rem, &value, &radix);  		// digit=value%radix;
		assert(!error);
		int overflow=twr_big_mult32u(&den, &den, radixin);
		assert(!overflow);
		buffer[i++]=digitchars[rem.word[0]];
		if (twr_big_iszero(&value)) {
			_strhorizflip(buffer+istart, i-istart);
			buffer[i]=0;
			return 0;
		}
	}
}

static int _isdigit(int c) {
	return c>='0' && c<='9';
}

int twr_big_atoi(const char *str, struct twr_bigint *result) {
	twr_big_bzero(result);
	int num_digits=0;

	while (_isdigit(str[num_digits])) {
		int overflow=twr_big_mult32u(result, result, 10);
		assert(!overflow);
		overflow=twr_big_add32u(result, result, str[num_digits]-'0');
		assert(!overflow);
		num_digits++;
	}

	return num_digits;
}

int twr_big_run_unit_tests() {
	struct twr_bigint a;
	struct twr_bigint b;
	struct twr_bigint c;

	twr_big_bzero(&a);
	if (!twr_big_iszero(&a)) return 0;
	if (!twr_big_isequal32u(&a, 0)) return 0;
	if (twr_big_isequal32u(&a, 1)) return 0;

	twr_big_assign32u(&a, 1);
	if (twr_big_shiftleft_words(&a, 1)) return 0;
	if (a.len!=2) return 0;
	if (a.word[0]!=0 || a.word[1]!=1) return 0;

	twr_big_assign64u(&a, 1ULL<<32 | 1);
	if (twr_big_isequal32u(&a, 1)) return 0;
	if (!twr_big_shiftleft_words(&a, BIG_INT_WORD_COUNT-1)) return 0;
	if (a.word[BIG_INT_WORD_COUNT-1]!=1) return 0;
	if (a.word[0]!=0 || a.word[1]!=0 || a.word[2]!=0) return 0;

	twr_big_assign64u(&a, 1);
	if (a.len!=1) return 0;

	twr_big_assign128u(&a, 1,1);
	if (a.len!=3) return 0;

	twr_big_assign128u(&a, 0, 1);
	if (a.len!=1) return 0;

	twr_big_2pow(&a, BIG_INT_WORD_COUNT*32-1);  // set high bit
	if (!twr_big_shiftleft_words(&a, 1)) return 0;
	if (!twr_big_iszero(&a)) return 0;

	twr_big_bmax(&a);
	if (!twr_big_shiftleft_words(&a, 1)) return 0;
	if (a.word[0]!=0) return 1;
	if (0==a.word[BIG_INT_WORD_COUNT-1]) return 1;
	if (BIG_INT_WORD_COUNT!=a.len) return 1;

	twr_big_bmax(&a);
	twr_big_assign32u(&a, 1);
	if (!twr_big_shiftleft_words(&a, BIG_INT_WORD_COUNT)) return 0;
	if (!twr_big_iszero(&a)) return 0;

	twr_big_bmax(&a);
	twr_big_assign32u(&a, 1);
	if (!twr_big_shiftleft_words(&a, BIG_INT_WORD_COUNT+1)) return 0;
	if (!twr_big_iszero(&a)) return 0;

	twr_big_assign32u(&a, 0);
	if (twr_big_shiftleft_onebit(&a)) return 0;
	if (!twr_big_iszero(&a)) return 0;

	twr_big_2pow(&a, BIG_INT_WORD_COUNT*32-1);  // set high bit
	if (!twr_big_shiftleft_onebit(&a)) return 0;
	if (!twr_big_iszero(&a)) return 0;

	twr_big_assign32u(&a,  1<<31);
	if (twr_big_shiftleft_words(&a, BIG_INT_WORD_COUNT-1)) return 0;
	twr_big_2pow(&b, 31+(BIG_INT_WORD_COUNT-1)*32);
	if (!twr_big_isequal(&a, &b)) return 0;

	twr_big_2pow(&a, BIG_INT_WORD_COUNT*32-1);  // set high bit
	if (twr_big_shiftright_words(&a, BIG_INT_WORD_COUNT-1)) return 0;
	if (twr_big_get_word(&a, BIG_INT_WORD_COUNT-1)) return 0;
	if (!twr_big_get_word(&a, 0)) return 0;

	twr_big_assign32u(&a,  1<<31);
	if (!twr_big_shiftright_words(&a, 1)) return 0;
	if (0!=a.word[0]) return 0;
	if (a.len!=1) return 0;

	twr_big_assign32u(&b, 1);
	twr_big_bmax(&a);
	for (int i=0; i < BIG_INT_WORD_COUNT*32-1; i++)
		if (!twr_big_shiftright_onebit(&a)) 
			return 0;
	if (!twr_big_isequal(&a, &b)) return 0;

	twr_big_bmax(&a);
	if (!twr_big_shiftright_bits(&a, BIG_INT_WORD_COUNT*32-1)) return 0;
	if (!twr_big_isequal(&a, &b)) return 0;
	
	twr_big_bmax(&a);
	twr_big_add32u(&a, &a, 1);
	if (!twr_big_iszero(&a)) return 0;
	if (!twr_big_isint32u(&a)) return 0;

	twr_big_assign32u(&a, UINT32_MAX);
	twr_big_add32u(&a, &a, 1);
	if (twr_big_iszero(&a)) return 0;
	if (twr_big_isint32u(&a)) return 0;

	twr_big_2pow(&a, 52);
	twr_big_2pow(&b, 52);
	if (!twr_big_isequal(&a, &b)) return 0;
	if (!twr_big_isgteq(&a, &b)) return 0;
	if (!twr_big_islteq(&a, &b)) return 0;
	if (twr_big_islt(&a, &b)) return 0;
	if (twr_big_isgt(&a, &b)) return 0;
	
	twr_big_2pow(&b, 100);
	if (twr_big_isequal(&a, &b)) return 0;
	if (twr_big_isgteq(&a, &b)) return 0;
	if (!twr_big_islteq(&a, &b)) return 0;
	if (!twr_big_isgteq(&b, &a)) return 0;

	twr_big_assign64u(&a, UINT64_MAX);
	twr_big_assign32u(&b, 0);
	twr_big_mult(&c, &a, &b);
	if (!twr_big_iszero(&c)) return 0;

	twr_big_bmax(&b);
	if (!twr_big_mult32u(&c, &b, 2)) return 0;

	twr_big_assign64u(&b, UINT64_MAX);
	if (twr_big_mult(&c, &a, &b)) return 0;
	twr_big_assign128u(&a, 0xfffffffffffffffeULL, 0x0000000000000001ULL);
	if (!twr_big_isequal(&a, &c)) return 0;
	twr_big_2pow(&c, 51);
	twr_big_assign64u(&a, (uint64_t)1<<51);
	if (!twr_big_isequal(&a, &c)) return 0;
	twr_big_2pow(&c, 0);
	twr_big_assign32u(&a, 1);
	if (!twr_big_isequal(&a, &c)) return 0;
	twr_big_pow(&c, 10, 9);
	twr_big_assign64u(&a, 1000000000);
	if (!twr_big_isequal(&a, &c)) return 0;

	twr_big_2pow(&a, 500);
	twr_big_pow(&b, 2, 500);
	if (!twr_big_isequal(&a, &b)) return 0;

	twr_big_assign128u(&a, (uint64_t)0x0123456789ABCDEF, (uint64_t)0xFEDCBA9876543210);
	if (twr_big_get_word(&a, 0x76543210)) return 0;
	if (twr_big_get_word(&a,0xFEDCBA98)) return 0;
	if (twr_big_get_word(&a,0x89ABCDEF)) return 0;
	if (twr_big_get_word(&a,0x01234567)) return 0;
	twr_big_assign128u(&a, 0, 0);
	if (!twr_big_iszero(&a)) return 0;


	twr_big_assign64u(&a, (uint64_t)0xFEDCBA9876543210);
	if (twr_big_get_word(&a,0x76543210)) return 0;
	if (twr_big_get_word(&a,0xFEDCBA98)) return 0;
	twr_big_assign64u(&a, 0);

	twr_big_bmax(&b);
	twr_big_bzero(&a);
	twr_big_assign(&a, &b);
	twr_big_add32u(&a, &a, 1);
	if (!twr_big_iszero(&a)) return 0;

	twr_big_pow(&a, 10, 250);
	twr_big_assign(&b, &a);
	if (twr_big_shiftleft_words(&a, 7)) return 0;
	if (twr_big_shiftleft_bits(&b, 7*32)) return 0;
	if (!twr_big_isequal(&a, &b)) return 0;

	twr_big_assign32u(&a, 8);
	if (twr_big_get_bit(&a,	3)!=1) return 0;
	if (twr_big_get_bit(&a,	2)!=0) return 0;
	if (twr_big_get_bit(&a,	4)!=0) return 0;
	twr_big_set_bit(&a,	3, 0);
	if (twr_big_get_bit(&a,	3)!=0) return 0;

	twr_big_assign64u(&a, (uint64_t)0x8000000000000000);
	if (twr_big_get_bit(&a,	63)!=1) return 0;
	if (twr_big_get_bit(&a,	64)!=0) return 0;
	if (twr_big_get_bit(&a,	62)!=0) return 0;
	twr_big_set_bit(&a,	63, 0);
	if (twr_big_get_bit(&a,	63)!=0) return 0;

	twr_big_assign32u(&a, 1);
	twr_big_shiftleft_bits(&a, BIG_INT_WORD_COUNT*32-1);
	if (twr_big_get_bit(&a, BIG_INT_WORD_COUNT*32-1)!=1) return 0;
	if (twr_big_get_bit(&a, BIG_INT_WORD_COUNT*32-2)!=0) return 0;
	twr_big_set_bit(&a, BIG_INT_WORD_COUNT*32-1, 0);
	if (twr_big_get_bit(&a, BIG_INT_WORD_COUNT*32-1)!=0) return 0;

	twr_big_pow(&a, 10, 123);
	twr_big_pow(&b, 10, 123);
	twr_big_add(&c, &a, &b);  
	twr_big_sub(&a, &a, &b);
	if (!twr_big_iszero(&a)) return 0;
	twr_big_assign32u(&a, 2);
	twr_big_mult(&a, &b, &a);
	if (!(twr_big_isequal(&a, &c))) return 0;

	twr_big_bzero(&a);
	twr_big_assign32u(&b, 1);
	twr_big_sub(&a, &a, &b);

	twr_big_bmax(&b);
	if (!twr_big_isequal(&a, &b)) return 0;

	twr_big_assign32u(&a, 2);
	twr_big_assign32u(&b, 1);
	twr_big_sub(&c, &b, &a);
	twr_big_bmax(&b);
	if (!twr_big_isequal(&c, &b)) return 0;


	struct twr_bigint q,r;
	twr_big_assign32u(&a, 8);
	twr_big_assign32u(&b, 2);
	twr_big_assign32u(&c, 4);
	twr_big_div(&q, &r, &a, &b);
	if (!twr_big_isequal(&q, &c)) return 0;
	if (!twr_big_iszero(&r)) return 0;

	twr_big_pow(&a, 10, 150);
	twr_big_pow(&b, 10, 50);
	twr_big_add32u(&a, &a, 1);
	twr_big_div(&q, &r, &a, &b);
	twr_big_pow(&c, 10, 100);
	if (!twr_big_isequal(&q, &c)) return 0;
	twr_big_assign32u(&c, 1);
	if (!twr_big_isequal(&r, &c)) return 0;

	struct twr_bigint num, den;
	twr_big_assign32u(&den, 1);
	twr_big_assign32u(&num, 1);
	if (0!=twr_big_10log(&num, &den)) return 0;

	twr_big_assign32u(&num, 9);
	if (0!=twr_big_10log(&num, &den)) return 0;

	twr_big_assign32u(&num, 10);
	if (1!=twr_big_10log(&num, &den)) return 0;

	twr_big_assign32u(&den, 9);
	twr_big_assign32u(&num, 1);
	if (-1!=twr_big_10log(&num, &den)) return 0;

	twr_big_assign32u(&den, 10);
	if (-1!=twr_big_10log(&num, &den)) return 0;

	twr_big_bmax(&num);
	twr_big_bmax(&den);
	if (0!=twr_big_10log(&num, &den)) return 0;

	twr_big_assign32u(&num, 1);
	int xx;
	if (BIG_INT_WORD_COUNT==64) {
		xx=twr_big_10log(&num, &den);
		if (-617 != xx) return 0;
	}

	twr_big_pow(&den, 10, 600);
	xx=twr_big_10log(&num, &den);
	if (xx!=-600) return 0;

	twr_big_assign32u(&den, 1);
	twr_big_pow(&num, 10, 600);
	xx=twr_big_10log(&num, &den);
	if (600 != xx) return 0;


	twr_big_assign32u(&den, 1);
	twr_big_assign32u(&num, 1);
	if (0!=twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&num, 2);
	if (1!=twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&num, 3);
	if (1!=twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&den, 1<<1);
	twr_big_assign32u(&num, 1);
	if (-1!=twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&den, 3);
	if (-2!=twr_big_2log(&num, &den)) return 0;

	twr_big_assign64u(&den, 1ULL<<63);
	if (-63!=twr_big_2log(&num, &den)) return 0;

	twr_big_bmax(&num);
	twr_big_bmax(&den);
	if (0!=twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&num, 1);
	if (-(BIG_INT_WORD_COUNT*32) != twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&den, 1);
	twr_big_bmax(&num);
	if ((BIG_INT_WORD_COUNT*32-1) != twr_big_2log(&num, &den)) return 0;

	twr_big_assign32u(&a, 0);
	if (twr_big_num10digits(&a)!=1) return 0;

	twr_big_assign32u(&a, 9);
	if (twr_big_num10digits(&a)!=1) return 0;

	twr_big_assign32u(&a, 1234);
	if (twr_big_num10digits(&a)!=4) return 0;

	twr_big_10pow(&a, 15);
	if (twr_big_num10digits(&a)!=16) return 0;

	twr_big_10pow(&a, 50);
	if (twr_big_num10digits(&a)!=51) return 0;

	struct twr_bigint small, big;
	twr_big_bzero(&small);
	twr_big_bmax(&big);
	if (twr_big_min(&big, &small)!=&small) return 0;
	if (twr_big_min(&small, &big)!=&small) return 0;
	if (twr_big_max(&big, &small)!=&big) return 0;
	if (twr_big_max(&small, &big)!=&big) return 0;

	twr_big_pow(&big, 10, 10);
	twr_big_assign64u(&small, 10000000000);
	if (!twr_big_isequal(&big, &small)) return 0;

	twr_big_10pow(&big, 0);
	if (!twr_big_isequal32u(&big, 1)) return 0;
	twr_big_10pow(&big, 1);
	if (!twr_big_isequal32u(&big, 10)) return 0;
	twr_big_10pow(&big, 2);
	if (!twr_big_isequal32u(&big, 100)) return 0;
	twr_big_10pow(&big, 3);
	if (!twr_big_isequal32u(&big, 1000)) return 0;
	twr_big_10pow(&big, 4);
	if (!twr_big_isequal32u(&big, 10000)) return 0;
	twr_big_10pow(&big, 5);
	if (!twr_big_isequal32u(&big, 100000)) return 0;
	twr_big_10pow(&big, 6);
	if (!twr_big_isequal32u(&big, 1000000)) return 0;
	twr_big_10pow(&big, 7);
	if (!twr_big_isequal32u(&big, 10000000)) return 0;
	twr_big_10pow(&big, 8);
	if (!twr_big_isequal32u(&big, 100000000)) return 0;
	twr_big_10pow(&big, 9);
	if (!twr_big_isequal32u(&big, 1000000000)) return 0;

	twr_big_10pow(&big,  11);
	twr_big_assign64u(&small, 100000000000);
	if (!twr_big_isequal(&big, &small)) return 0;

	twr_big_10pow(&big,  12);
	twr_big_assign64u(&small, 1000000000000);
	if (!twr_big_isequal(&big, &small)) return 0;

	twr_big_10pow(&big,  13);
	twr_big_assign64u(&small, 10000000000000);
	if (!twr_big_isequal(&big, &small)) return 0;
	
	twr_big_5pow(&big, 1);
	if (!twr_big_isequal32u(&big, 5)) return 0;
	twr_big_5pow(&big, 13);
	if (!twr_big_isequal32u(&big, 1220703125)) return 0;

	

	return 1;

	
}
