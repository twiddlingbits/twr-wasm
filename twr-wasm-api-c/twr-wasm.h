#include "twr-io.h"

/* WebAssembly.ModuleExports (C functions callable by javascript/typescript)  */
int twr_wasm_malloc(int size);
void twr_wasm_init(int pf);    // pf 0 - set printf to debug console.  pf 1 - set printf to stdout

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_stdiocon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon();

/* WebAssembly.ModuleImports (Javascript/Typescript functions callable by C code) */
extern void twrStdout(int c);   
extern int twrDebugLog(int c);	
extern int twrStdin();	

extern int twrCanvasGetAvgCharWidth();
extern int twrCanvasGetCharHeight();
extern int twrCanvasGetColorWhite();
extern int twrCanvasGetColorBlack();
extern void twrCanvasFillRect(int x, int y, int w, int h, int color);
extern void twrCanvasCharOut(int x, int y, int ch); 
extern int twrCanvasin();
extern int twrCanvasInkey();


