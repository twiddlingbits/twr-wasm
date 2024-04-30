#include <stdlib.h>
#include "twr-crt.h"  //twr_trap

_Noreturn void abort(void) {
	twr_trap();
}


//_Noreturn void abort(void)  //(since C11), (until C23)
//[[noreturn]] void abort(void);  //(since C23)
