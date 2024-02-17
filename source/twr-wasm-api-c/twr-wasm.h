#include "twr-io.h"
#include "twr-draw2d.h"

/* WebAssembly.ModuleExports (C functions callable by javascript/typescript)  */
void twr_wasm_init(int pf);  

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon();

/* WebAssembly.ModuleImports (Javascript/Typescript functions callable by C code) */
extern void twrDivCharOut(int c);   
extern int twrDivCharIn();
extern int twrDebugLog(int c);	

extern int twrCanvasGetProp(const char *);
extern void twrCanvasDrawSeq(struct d2d_draw_seq *);
extern int twrCanvasCharIn();
extern int twrCanvasInkey();


