#include "twr-io.h"
#include "twr-draw2d.h"

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon();

void twr_wasm_sleep(int ms);

/* WebAssembly.ModuleExports (C functions used by tiny-wasm-runtime TS code)  */
/* not generally used directly by applications -- use TS classes twrWasmModule and twrWasmModuleAsync */
void twr_wasm_init(int pf, unsigned long mem_size); 
void twr_wasm_print_mem_debug_stats();

/* WebAssembly.ModuleImports (Javascript/Typescript functions callable by C code) */
/* these are not generally used directly by applications -- use the twr_wasm_() functions */
extern void twrDivCharOut(int c);   
extern int twrDivCharIn();

extern int twrCanvasGetProp(const char *);
extern void twrCanvasDrawSeq(struct d2d_draw_seq *);
extern int twrCanvasCharIn();
extern int twrCanvasInkey();

extern void twrSleep(int ms);
extern int twrDebugLog(int c);	




