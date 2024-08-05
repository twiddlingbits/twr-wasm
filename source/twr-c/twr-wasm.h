#ifndef __TWR_WASM_H__
#define __TWR_WASM_H__

// twr_wasm_ functions are exported from C to Javascript

#ifdef __cplusplus
extern "C" {
#endif

/* WebAssembly.ModuleExports (C functions used by twr-wasm TS code)  */
/* not generally used directly by applications -- use TS classes twrWasmModule and twrWasmModuleAsync */
__attribute__((export_name("twr_wasm_init"))) void twr_wasm_init(int stdio_jsid, int stderr_jsid, int std2d_jsid, unsigned long mem_size); 
__attribute__((export_name("twr_wasm_print_mem_debug_stats"))) void twr_wasm_print_mem_debug_stats(void);

#ifdef __cplusplus
}
#endif

#endif





