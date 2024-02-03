#include "twr-crt.h"
#include "twr-wasm.h"

/* WebAssembly.ModuleExports (C functions callable by javascript/typescript)  */
/* need to appear on --export arg to wasm-ld in makefile */

int twr_wasm_malloc(int size) {
	return (int)twr_malloc(size);
}

/* pf 0 - printf goes to web browser debug console */
/* pf 1 - printf goes to web browser twr_stdout DIV */
/* pf 2 - printf goes to null console (default if this call not made) */

void twr_wasm_init(int pf) {
	if (pf==1) twr_set_printf_con(twr_wasm_get_stdiocon());
	else if(pf==2) twr_set_printf_con(twr_get_nullcon());
	else twr_set_printf_con(twr_wasm_get_debugcon());
}
