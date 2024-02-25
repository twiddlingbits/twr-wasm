#include <assert.h>
#include "twr-crt.h"
#include "twr-wasm.h"


/*
	__heap_base: This variable points to the start of the heap memory region.
	__data_end: This variable points to the end of the data memory region.
	__stack_pointer: This variable points to the top of the stack memory region.
	__global_base: This variable points to the start of the global variable region.
	__table_base: This variable points to the start of the table region.
	__memory_base: This variable points to the start of the memory region.
*/

extern unsigned char __heap_base;
//extern unsigned char __stack_pointer;
extern unsigned char __global_base;
extern unsigned char __table_base;
extern unsigned char __memory_base;
extern unsigned char __data_end;

/* pf 0 - printf goes to web browser debug console */
/* pf 1 - printf goes to web browser DIV */
/* pf 2 - printf goes to web browser Canvas */
/* pf 3 - printf goes to null console (default if this call not made) */
/* width, height only used when pf is windowcon (Canvas) */

void twr_wasm_init(int pf, unsigned long mem_size) {
	struct IoConsole* con;

	twr_set_dbgout_con(twr_wasm_get_debugcon());

	//twr_dbg_printf("init pf %d\n",pf);

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

void twr_wasm_print_mem_debug_stats() {
	twr_dbg_printf("wasm module memory map:\n");
	twr_dbg_printf("   __memory_base: 0x%x\n", &__memory_base);
	twr_dbg_printf("   __table_base: 0x%x\n", &__table_base);
	twr_dbg_printf("   __global_base: 0x%x\n", &__global_base);
	twr_dbg_printf("   __data_end: 0x%x\n", &__data_end);
	//twr_dbg_printf("   top of stack: %x", &__stack_pointer);
	twr_dbg_printf("   __heap_base: 0x%x\n", &__heap_base);
	const twr_size_t stack_size = &__heap_base-&__data_end;
	twr_dbg_printf("   code+global size: %d\n", &__heap_base-stack_size);
	twr_dbg_printf("   stack size: %d\n", stack_size);

	twr_malloc_debug_stats();
}