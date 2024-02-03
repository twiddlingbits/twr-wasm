#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "twr-bigint.h"

// eg. 7! := 1×2×3×4×5×6×7. Factorial zero is defined as equal to 1
// factorial of 300 is the largest bigint that will fit in a 64 word bigint size

int main (int argc, char *argv[]) {
	if (argc!=2) {
		printf("usage: factorial n - to compute n!\n");
		exit(1);
	}
	
	int i=atoi(argv[1]);

	if (i<0)  {
		printf("please use a positive number.\n");
		exit(1);
	}

	printf("computing %d!\n", i);

	struct twr_bigint result;
	int overflow=0;	

	twr_big_assign32u(&result, 1);
	while (i > 1 && !overflow) {
		overflow=twr_big_mult32u(&result, &result, i);  // result = result * i
		i--;
	}

	if (overflow)
		printf("result is too large to fit in a bigint!  Increase size of BIG_INT_WORD_COUNT");
	else {
		uint32_t n=twr_big_num10digits(&result);
		printf("the result has %d digits\n", n);

		char buffer[n+1];
		twr_big_itoa(&result, buffer, sizeof(buffer), 10);
		printf("%s\n", buffer);
	}
	
}
