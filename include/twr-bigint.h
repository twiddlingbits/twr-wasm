
/* Copyright 2023 Anthony J. Wood */
/* Okay to use under MIT license */

/** a unsigned bigint of max size BIG_INT_WORD_COUNT*32 bits */

#ifndef __TWR_BIGINT_H__
#define __TWR_BIGINT_H__

#include <stdint.h>  

#define BIG_INT_WORD_COUNT 80

struct twr_bigint {
	uint32_t word[BIG_INT_WORD_COUNT];
	unsigned int len;
};

#define BIGINT_LOG_OFZERO_ERROR INT32_MIN

unsigned int twr_big_get_length(struct twr_bigint * big);
uint32_t twr_big_get_word(struct twr_bigint * big, unsigned int n);

void twr_big_bzero(struct twr_bigint* big);
void twr_big_bzero_long(struct twr_bigint * big, unsigned int len);
void twr_big_bmax(struct twr_bigint* big);

int twr_big_iszero(struct twr_bigint* big);
int twr_big_isint32u(struct twr_bigint* big);
int twr_big_isequal(struct twr_bigint* big1, struct twr_bigint* big2);
int twr_big_isequal32u(struct twr_bigint * big1, uint32_t i32);
int twr_big_isgteq(struct twr_bigint* big1, struct twr_bigint* big2);
int twr_big_islteq(struct twr_bigint* big1, struct twr_bigint* big2);
int twr_big_isgt(struct twr_bigint* big1, struct twr_bigint* big2);
int twr_big_islt(struct twr_bigint* big1, struct twr_bigint* big2);

int twr_big_2pow(struct twr_bigint* big, int exp);
int twr_big_5pow(struct twr_bigint * big, int exp);
int twr_big_10pow(struct twr_bigint * big, int exp);
int twr_big_pow(struct twr_bigint* big, unsigned int base, int exp);
int twr_big_2log(struct twr_bigint* numin, struct twr_bigint* denin);
int twr_big_10log(struct twr_bigint* numin, struct twr_bigint* denin);

void twr_big_assign(struct twr_bigint* dest, struct twr_bigint* source);
void twr_big_assign32u(struct twr_bigint* big, uint32_t ui);
void twr_big_assign64u(struct twr_bigint* big, uint64_t ui);
void twr_big_assign128u(struct twr_bigint* big, uint64_t uh, uint64_t ul);
uint32_t twr_big_get32u(struct twr_bigint* big);

struct twr_bigint* twr_big_min(struct twr_bigint* a, struct twr_bigint* b);
struct twr_bigint* twr_big_max(struct twr_bigint* a, struct twr_bigint* b);

int twr_big_shiftleft_words(struct twr_bigint* bi, unsigned int n);
int twr_big_shiftleft_onebit(struct twr_bigint* bi);
int twr_big_shiftleft_bits(struct twr_bigint* bi, unsigned int n);
int twr_big_shiftright_words(struct twr_bigint* bi, unsigned int n);
int twr_big_shiftright_onebit(struct twr_bigint* bi);
int twr_big_shiftright_bits(struct twr_bigint* bi, unsigned int n);
void twr_big_set_bit(struct twr_bigint* big, unsigned int bitnum, unsigned int val);
int twr_big_get_bit(struct twr_bigint* big, unsigned int bitnum);
void twr_big_complement(struct twr_bigint* result, struct twr_bigint* in);

int twr_big_add(struct twr_bigint* sum, struct twr_bigint* addend1, struct twr_bigint* addend2);
int twr_big_add32u(struct twr_bigint* sum, struct twr_bigint * addend1, uint32_t addend2);
void twr_big_sub(struct twr_bigint* r, struct twr_bigint* a, struct twr_bigint* b);
int twr_big_mult(struct twr_bigint* product, struct twr_bigint* multiplicand, struct twr_bigint* multipler);
int twr_big_mult32u(struct twr_bigint* product, struct twr_bigint* multiplicand, uint32_t multipler);
int twr_big_div(struct twr_bigint* q, struct twr_bigint* r, struct twr_bigint* num, struct twr_bigint* den);

int twr_big_itoa(struct twr_bigint * valuein, char* buffer, int size, int radixin);
int twr_big_atoi(const char *str, struct twr_bigint* result);
uint32_t twr_big_num10digits(struct twr_bigint* numberin);

int twr_big_run_unit_tests();


#endif
