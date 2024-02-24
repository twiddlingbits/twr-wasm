#include <assert.h>
#include "twr-crt.h"
#include "twr-wasm.h"

/* WebAssembly.ModuleExports (C functions callable by javascript/typescript)  */
/* need to appear on --export arg to wasm-ld in makefile */

/* pf 0 - printf goes to web browser debug console */
/* pf 1 - printf goes to web browser DIV */
/* pf 2 - printf goes to web browser Canvas */
/* pf 3 - printf goes to null console (default if this call not made) */
/* width, height only used when pf is windowcon (Canvas) */

void twr_wasm_init(int pf, unsigned long mem_size) {
	struct IoConsole* con;

	//twr_wasm_dbg_printf("init pf %d\n",pf);

/*
	__heap_base: This variable points to the start of the heap memory region.
	__data_end: This variable points to the end of the data memory region.
	__stack_pointer: This variable points to the top of the stack memory region.
	__global_base: This variable points to the start of the global variable region.
	__table_base: This variable points to the start of the table region.
	__memory_base: This variable points to the start of the memory region.
*/
	extern unsigned char __heap_base;
	twr_size_t base;

	base=(twr_size_t)&__heap_base;
	assert((base&7)==0);  // seems to always be the case

	twr_init_malloc((uint64_t*)base, mem_size-base);
	//twr_malloc_unit_test();

	switch (pf) {
		case 0:
			con=twr_wasm_get_debugcon();
			break;

		case 1:
			con=twr_wasm_get_divcon();
			break;

		case 2:
			con=twr_wasm_get_windowcon();
			break;

		case 3:
			con=twr_get_nullcon();
			break;

		default:
			con=twr_wasm_get_debugcon();
	}

	twr_set_stdio_con(con);

}