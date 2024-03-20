#ifndef __STACK_H__
#define __STACK_H__

#include <stdbool.h>

#define MAX_STACKSIZE 5000

struct Stack {
	unsigned short sp;
	unsigned short x[MAX_STACKSIZE];
	unsigned short y[MAX_STACKSIZE];
};


bool PushStack(struct Stack* stack, unsigned short x, unsigned short y);
bool PopStack(struct Stack* stack, unsigned short *x, unsigned short *y);
void InitStack(struct Stack* stack);

#endif


