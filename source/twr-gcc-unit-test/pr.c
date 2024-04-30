#include <stdio.h>

// printf output tests

int main() {

	printf("g double    %g, %g, %g\n", .5, .1, 1.0/3.0);
	printf("g double .6 %.6g, %.6g, %.6g\n", .5, .1, 1.0/3.0);
	printf("g double.15 %.15g, %.15g, %.15g\n", .5, .1, 1.0/3.0);

	printf("g float     %g, %g, %g\n", .5f, .1f, 1.0f/3.0f);
	printf("g float .6  %.6g, %.6g, %.6g\n", .5f, .1f, 1.0f/3.0f);
	printf("g float .15 %.15g, %.15g, %.15g\n", .5f, .1f, 1.0f/3.0f);


	printf("f double   %f, %f, %f\n", .5, .1, 1.0/3.0);
	printf("f float    %f, %f, %f\n", .5f, .1f, 1.0f/3.0f);

	printf("g double.15 %.15g, %.15g, %.15g\n", 1000.5, 1000.1, 1000+1.0/3.0);
	printf("g double    %g, %g, %g\n", 1000.5, 1000.1, 1000+1.0/3.0);
	printf("g double    %g, %g, %g\n", 100000.5, 100000.1, 100000+1.0/3.0);
	printf("g double    %g, %g, %g\n", 10000000.5, 10000000.1, 10000000+1.0/3.0);

	printf("g double   '% g', '%g', '%6.2g'\n", 1.5, -1.5, -1.5);
	printf("g double   '%.1g', '%.1g', '%.1g'\n", 125.0, 125.1, 10.0);

	printf("f double   '%f', '%f', '%8.2f'\n", 123.45678, -123.45678, 123.45678);
	printf("f double   '% f', '%f', '%6.2f'\n", .5, -.5, -.5);
	printf("d          '%d', '% d', '%6.2d'\n", 5, 5, -5);

	printf("e double   '%e', '%e', '%8.2e'\n", 123.45678, -123.45678, 123.45678);
	printf("e double   '% e', '%e', '%6.2e'\n", .5, -.5, -.5);


	return 0;

}