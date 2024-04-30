#include <stdbool.h>
#include <assert.h>
#include <ctype.h>
#include <string.h>
#include "twr-crt.h"


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

int64_t twr_atou64(const char *str, int* len) {
	int64_t result=0;

	*len=0;
	while (isdigit(str[*len])) {
		result=result*10;
		result=result+(str[*len]-'0');
		(*len)++;
	}

	return result;
}

int atoi(const char *str) {
	int len;

	int sign=twr_atosign(str, &len);
	int value=(int)twr_atou64(str+len, &len);

	return sign*value;
}

long atol(const char *str) {
	int len;

	long sign=twr_atosign(str, &len);
	long value=(long)twr_atou64(str+len, &len);

	return sign*value;
}

long long atoll(const char *str) {
	int len;

	long long sign=twr_atosign(str, &len);
	long long value=(long long)twr_atou64(str+len, &len);

	return sign*value;
}

long strtol(const char *str, char **str_end, int base ) {

	assert(base==10);

	int len;
	long retval=(long)twr_atou64(str, &len);

	if (str_end) *str_end=(char *)str+len;

	return retval;
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

/****************************************************************/
/****************************************************************/
/****************************************************************/

int num_int_unit_test() {
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
