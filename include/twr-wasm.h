#include "twr-io.h"
#include "twr-draw2d.h"

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon();

#define twr_wasm_dbg_printf(...) io_printf(twr_wasm_get_debugcon(), __VA_ARGS__)

void twr_wasm_sleep(int ms);

/* WebAssembly.ModuleExports (C functions used by tiny-wasm-runtime TS code)  */
/* not generally used directly by applications -- use TS classes twrWasmModule and twrWasmModuleAsync */
void twr_wasm_init(int pf, unsigned long mem_size); 

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




