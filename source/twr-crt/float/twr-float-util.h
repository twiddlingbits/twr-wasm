#include <stdint.h>
#include "twr-bigint.h"

/* deconstructed double */
struct floatieee {
	double doubleval;
	uint64_t mantissa;
	uint16_t expraw;
	uint16_t sign;
	uint16_t isinf;   /* sign can indidicte negative infinity */
	uint16_t iszero;  /* sign can indidicte negative zero */
	uint16_t isnan;
	uint16_t isdenormal;
};

/* float base 2 with ieee special cases removed */
struct float2 {
	uint64_t mantissa;
	int16_t exp;
	uint16_t sign;
};

/* float base 10 (both digits ("mantissa") and exponent) */
struct float10 {
	struct twr_bigint digits;
	int exp;
};

/* bigint fraction with denominator of base 2*/
struct frac2 {
	struct twr_bigint num;
	unsigned int denexp;  /* den = 2^denexp, denexp may not be neg */
};

/* bigint fraction with denominator of base 10 */
struct frac10 {
	struct twr_bigint num;  // numerator
	unsigned int denexp;  /* den = 10^denexp, denexp may not be negative */
};

void floatieee_new(struct floatieee* fie, double value);
void floatieee_from_float2(struct floatieee* fie, struct float2* f2);
void floatieee_binf(struct floatieee* fie);
void floatieee_bneginf(struct floatieee* fie);
void floatieee_bzero(struct floatieee* fie);

void float2_new(struct float2 *df, struct floatieee* fie);
void float2_inc_mantissa(struct float2 *f2);
void float2_dec_mantissa(struct float2 *f2);

void frac2_new(struct frac2* f2, struct float2* df);
void frac2_getden(struct frac2* f2, struct twr_bigint* den);
int  frac2_10log(struct frac2* f2);
void frac2_simplify(struct frac2* f2);
int  frac2_get_digits(struct frac2* f2, struct twr_bigint * digits_out, int shift10, int doround);
uint32_t frac2_get_single_digit(struct frac2* f2, struct twr_bigint * digitstosub, int shift10);

void frac10_new(struct frac10* f10, struct frac2* f2);
void frac10_simplify(struct frac10* f10);
void frac10_getden(struct frac10* f10, struct twr_bigint* den);
int  frac10_round_b(struct frac10* f10, int new_num_sig_digits);
void frac10_round_a(struct frac10* f10, int chop);
void frac10_match_den(struct frac10* a, struct frac10* b, struct frac10* c);
void frac10_adjust_den(struct frac10* f10, int newden);
int frac10_10log(struct frac10 *f10);
unsigned int twr_big_remove_trailing_zeros(struct twr_bigint *big);


int numdigits2(uint64_t n);
int multiexp10(struct twr_bigint *result, struct twr_bigint *multiplicand, int exp);
void nstrcopy(char *buffer, const int sizeInBytes, const char *outstring, const int sizeofoutstring, int n);

int twr_float_unit_test();








