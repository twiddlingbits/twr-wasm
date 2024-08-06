#include <stdio.h>
#include <stdlib.h>
#include "twr-crt.h"

void stdio_div() {
   char inbuf[64];
   char *r;
   int i;

   printf("Square Calculator\n");

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