#include "twr-crt.h"
#include "twr-wasm.h"

_Noreturn void twr_abort(void) {
	twr_wasm_trap();
}


//_Noreturn void abort(void)  //(since C11), (until C23)
//[[noreturn]] void abort(void);  //(since C23)
