#include <stdbool.h>
#include <assert.h>
#include <ctype.h>
#include <string.h>
#include <stdlib.h>
#include "twr-crt.h"

static int detect_base(const char* str, int * len) {
	if (*str=='0') {
		if (str[1]=='x' || str[1]=='X') {
			*len=2;
			return 16;
		}
		*len=1;
		return 8;
	}
	
	*len=0;
	return 10;
}
 
int twr_atosign(const char *str, int* len) {
	int sign=1;

	*len=0;

	/** ignore leading space */
	while (isspace(str[*len])) (*len)++;

	/** get optional sign */
	if (str[*len]=='+') (*len)++;
	else if (str[*len]=='-') {
		sign=-1;
		(*len)++;
	}

	return sign;
}

static int char_to_int(char c) {
	if (c>='0' && c<='9') return c-'0';
	c=tolower(c);
	if (c>='a' && c<='z') return c-'a'+10;

	return -1;
}

int64_t twr_atou64(const char *str, int* len, int radix) {
	assert (radix>=2 && radix<=36);
	int64_t result=0;
	int d;

	*len=0;
	while (1) {
		d=char_to_int(str[*len]);
		if (d==-1 || d>=radix) return result;
		result=result*radix;
		result=result+d;
		(*len)++;
	}
}

int atoi(const char *str) {
	int len;

	int sign=twr_atosign(str, &len);
	int value=(int)twr_atou64(str+len, &len, 10);

	return sign*value;
}

long atol(const char *str) {
	int len;

	long sign=twr_atosign(str, &len);
	long value=(long)twr_atou64(str+len, &len, 10);

	return sign*value;
}

long long atoll(const char *str) {
	int len;

	long long sign=twr_atosign(str, &len);
	long long value=(long long)twr_atou64(str+len, &len, 10);

	return sign*value;
}

//If successful, an integer value corresponding to the contents of str is returned.
//If the converted value falls out of range of corresponding return type, a range error occurs (setting errno to ERANGE) and LONG_MAX, LONG_MIN, LLONG_MAX or LLONG_MIN is returned.
//If no conversion can be performed, ​0​ is returned.

long long strtoll_l(const char *str, char **str_end, int base,  locale_t __attribute__((__unused__)) loc) {
	assert(str);
	if (str==NULL) return 0;

	if (*str==0) {
		if (str_end) *str_end=(char*)str;
		return 0;
	}

	int len;
	int sign=twr_atosign(str, &len);
	char*p = (char*)str+len;

	if (base==0) {  // auto detect
		base=detect_base(p, &len);
		p=p+len;
	}

	long retval=(long)twr_atou64(p, &len, base);
	p=p+len;

	if (str_end) *str_end=(char *)p;

	return sign*retval;
}

long long strtoll(const char *str, char **str_end, int base) {
	return strtoll_l(str, str_end, base, __get_current_locale());
}

long strtol(const char *str, char **str_end, int base) {
	long long r=strtoll(str, str_end, base);
	return (long)r;
}

unsigned long long strtoull_l(const char *str, char **str_end,  int base, locale_t __attribute__((__unused__)) loc) {
	assert(str);
	if (str==NULL) return 0;

	if (*str==0) {
		if (str_end) *str_end=(char*)str;
		return 0;
	}

	int len;
	char*p = (char*)str;

	if (base==0) {  // auto detect
		base=detect_base(p, &len);
		p=p+len;
	}

	long long retval=(long)twr_atou64(p, &len, base);
	p=p+len;

	if (str_end) *str_end=(char *)p;

	return retval;	
}

unsigned long long strtoull(const char *str, char **str_end,  int base) {
	return strtoull_l(str, str_end, base, __get_current_locale());
}


unsigned long strtoul(const char *str, char **str_end,  int base) {
	return (unsigned long)strtoull(str, str_end, base);
}

/****************************************************************/
/****************************************************************/
/****************************************************************/

int _itoa_s(int64_t value, char * buffer, size_t size, int radix) {
	size_t i=0;
	const char *digitchars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	if (size < 1) return 1;  /* error - buffer too small */
		
	if (radix < 2 || radix > 36)
		return 2;  /* invalid radix */

	if (value<0) {
		value=-value;
		if (size < 3) return 1;  /* error - buffer too small */
		buffer[i++]='-';
	}

	const int istart=i;

	while (1) {
		if (i>=(size-1)) return 1; /* error - buffer too small */
		int digit=value%radix;
		buffer[i++]=digitchars[digit];
		value=value/radix;
		if (value==0) {
			twr_strhorizflip(buffer+istart, i-istart);
			buffer[i]=0;
			return 0;
		}
	}
}

#pragma clang optimize off
// unit_test will fail with -O2, unclear why


/****************************************************************/
/****************************************************************/
/****************************************************************/

int cvtint_unit_test() {
	int len, r;
	char* end;
	long rl;
	long long rll;
	unsigned long rul;
	unsigned long long rull;

	r=twr_atou64("101",&len, 10);
	if (r!=101 || len!=3) return 0;

	r=twr_atou64("1",&len, 2);
	if (r!=1 || len!=1) return 0;

	r=twr_atou64("1001",&len, 2);
	if (r!=9 || len!=4) return 0;

	r=twr_atou64("1A0",&len, 16);
	if (r!=416 || len!=3) return 0;



	r=detect_base("",&len);
	if (r!=10 || len!=0) return 0;

	r=detect_base("0",&len);
	if (r!=8 || len!=1) return 0;

	r=detect_base("0x",&len);
	if (r!=16 || len!=2) return 0;

	r=detect_base("0X",&len);
	if (r!=16 || len!=2) return 0;



	r=twr_atosign("",&len);
	if (r!=1 || len!=0) return 0;

	r=twr_atosign("+1",&len);
	if (r!=1 || len!=1) return 0;

	r=twr_atosign("-1",&len);
	if (r!=-1 || len!=1) return 0;


	char* x="";
	rl=strtol(x, &end, 0);
	if (rl!=0 && x!=end) return 0;

	rl=strtol(x, NULL, 0);
	if (rl!=0) return 0;

	x=" +A";
	rl=strtol(x, &end, 16);
	if (rl!=10 && end!=x+3) return 0;

	x=" 0xA";
	rl=strtol(x, &end, 0);
	if (rl!=10 && end!=x+4) return 0;

	x="-123";
	rl=strtol(x, &end, 10);
	if (rl!=-123 && end!=x+4) return 0;

	x="1152921504606846976";
	rll=strtoll(x, &end, 0);
	if (rll!=1152921504606846976 && end!=x+19) return 0;


	x="-123";
	rul=strtoul(x, &end, 10);
	if (rul!=0 && end!=x) return 0;

	x="1152921504606846977";
	rull=strtoull(x, &end, 0);
	if (rull!=1152921504606846977 && end!=x+19) return 0;

	if (atoi("  +0005")!=5) return 0;
	if (atoi("499")!=499) return 0;
	if (atoi("-500")!=-500) return 0;	

	if (atol("  +0005")!=5) return 0;
	if (atol("499")!=499) return 0;
	if (atol("-99999999")!=-99999999) return 0;	

	if (atoll("  -0005")!=-5) return 0;
	if (atoll("499")!=499) return 0;
	if (atoll("2147483648")!=2147483648LL) return 0;	

	char buffer[360];
	if (_itoa_s(0 , buffer, sizeof(buffer), 10)!=0) return 0;
	if (strcmp(buffer, "0")!=0) return 0;

	if (_itoa_s(0 , buffer, sizeof(buffer), 10)!=0) return 0;
	if (strcmp(buffer, "0")!=0) return 0;

	if (_itoa_s(-892 , buffer, sizeof(buffer), 10)!=0) return 0;
	if (strcmp(buffer, "-892")!=0) return 0;

	if (_itoa_s(254 , buffer, sizeof(buffer), 2)!=0) return 0;
	if (strcmp(buffer, "11111110")!=0) return 0;
	if (_itoa_s(255 , buffer, 4, 2)==0) return 0;
	if (_itoa_s(0, buffer, 0, 10)==0) return 0;
	if (_itoa_s(0, buffer, 1, 10)==0) return 0;
	if (_itoa_s(0, buffer, 2, 10)!=0) return 0;
	if (strcmp(buffer, "0")!=0) return 0;

	return 1;
}

#pragma clang optimize on
