#include "stack.h"

/*
 * For all Stack routines, SP points to an empty entry that is
 * the next entry to use when pushing on to the stack.
 */

bool PushStack(struct Stack* stack, unsigned short x, unsigned short y)
{	
	if (stack->sp == MAX_STACKSIZE)
		return false;

	stack->x[stack->sp] = x;
	stack->y[stack->sp++] = y;
	return true;
}


bool PopStack(struct Stack* stack, unsigned short *x, unsigned short *y)
{	
	if (stack->sp == 0)
		return false;

	--stack->sp;

	*x = stack->x[stack->sp];
	*y = stack->y[stack->sp];
	return true;
}

void InitStack(struct Stack* stack)
{
	stack->sp=0;
}
