#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <string.h>
#include <errno.h>

// test what fcvt produces

void useOfFcvt(double x, int digits ) 
{ 
	char buf[400];
    int dec, sign; 
	int e;
  
    e = _fcvt_s(buf, sizeof(buf), x, digits, &dec, &sign); 
  
    // Print the converted string 
   // printf("%g, %d - fcvt result A: %c%c.%sX10^%d\n", x, digits, 
    //       sign == 0 ? '+' : '-', 
     //      '0', buf, dec); 
	printf("%g (g)\n", x); 
	printf("%e, (e)\n", x); 
	printf("%.15e, (.15e)\n", x);
	printf("%.20e, (.20e)\n", x);
    printf("%A (A)\n", x); 
    uint64_t ll;
    memcpy(&ll, &x, 8);
    printf("%llx\n", ll);

	printf("fcvt %d decimal digits. result: %s dec: %d sign: %d err:%d\n", digits, buf, dec, sign,e);

    printf("\n"); 
} 

double construct(int expin, uint64_t mantissa) 
{
    uint64_t out;
    double result;
    uint64_t exp = expin+1023;

    if ((mantissa & 0x000FFFFFFFFFFFFF)!=mantissa)
        printf("construct param error\n");

    out=(exp<<52)|(mantissa & 0x000FFFFFFFFFFFFF);
    memcpy(&result, &out, 8);

    return result;
}

int main() 
{ 
    useOfFcvt(0.99999, 2); 
    useOfFcvt(0.1, 2); 
    useOfFcvt(0.5, 1); 
    useOfFcvt(.000555555, 4); 
	useOfFcvt(1.06, 1); 
	useOfFcvt(1.04, 1); 
	useOfFcvt(-1.06, 1); 
	useOfFcvt(-1.04, 1); 
    useOfFcvt(123.45, 3); 
    useOfFcvt(-9.876, 3); 
    useOfFcvt((double)6.54321e+200, 10); 
    useOfFcvt((double)6.54321e-200, 10); 
    useOfFcvt((double)6.54321e-200, 210); 
    useOfFcvt((double)1.0e+200, 10); 
    useOfFcvt((double)1.0e+55, 10); 
    useOfFcvt((double)(72057594037927936), 10);   //* 2^56
    useOfFcvt((double)(72057594037927936+16), 10);   
    useOfFcvt((double)(0.1e-18), 30);   
    useOfFcvt((double)0, 1);   
    useOfFcvt((double)0, 10);  
    useOfFcvt((double)3.6e-310, 350);   
    useOfFcvt(NAN, 20); 
    useOfFcvt(INFINITY, 20);   
    useOfFcvt(123456789012345678901234567890.0, 2);   
    useOfFcvt(0.1, 2); 
    printf("marker\n");  
    useOfFcvt(construct(0,0x000FFFFFFFFFFFFF), 3);
    useOfFcvt(construct(0,0x0000000000000000), 3);
    useOfFcvt(construct(-1023, 0x000FFFFFFFFFFFFF), 370);
    printf("mark 2\n");
    useOfFcvt(construct(-1022,0), 370);
    useOfFcvt(construct(-1023,1), 370);
    useOfFcvt(construct(0,0), 3);
	useOfFcvt(1.0, 3); 
	useOfFcvt(10.23499965667724609375, 17); 
	useOfFcvt(10.234999656677246, 17); 
	useOfFcvt(10.235, 17); 
    

    return 0; 
}