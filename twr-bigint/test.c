#include <stdio.h>
#include "twr-bigint.h"

int twr_big_run_unit_tests();

int main() {
	printf("running twr-bigint.c tests...\n");
	if (twr_big_run_unit_tests())
		printf("all tests passed successfully\n");
	else
		printf("a test failed\n");
}

