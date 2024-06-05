#include <stdio.h>
#include <stdlib.h>
#include <locale.h>
#include "twr-crt.h"

void stdio_div() {
	char inbuf[64];
	char *r;
	int i;

	printf("Square Calculator\n");

	const char* locstr=setlocale(LC_ALL,"");  // not needed for numbers, but this is what you do to enable UTF-8 on twr_mbgets()
	printf("(locale set to '%s')\n\n", locstr);

	while (1) {
		printf("Enter an integer: ");
		r=twr_mbgets(inbuf);  // r is NULL if esc entered.  Otherwise r == inbuf
		if (r) {  
			i=atoi(inbuf);
			printf("%d squared is %d\n\n",i,i*i);
		}
		else {
			printf("\n");
		}
	}
}