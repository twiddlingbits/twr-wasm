#include "twr-io.h"

/* WebAssembly.ModuleExports (C functions callable by javascript/typescript)  */
void twr_wasm_init(int pf, int width, int height);  

/* WebAssembly.ModuleExports AND also C functions callable by C code  */
struct IoConsole* twr_wasm_get_divcon();
struct IoConsole* twr_wasm_get_debugcon();
struct IoConsole* twr_wasm_get_windowcon(int, int);

/* WebAssembly.ModuleImports (Javascript/Typescript functions callable by C code) */
extern void twrDivCharOut(int c);   
extern int twrDivCharIn();
extern int twrDebugLog(int c);	

extern int twrCanvasGetAvgCharWidth();
extern int twrCanvasGetCharHeight();
extern int twrCanvasGetColorWhite();
extern int twrCanvasGetColorBlack();
extern void twrCanvasFillRect(int x, int y, int w, int h, int color);
extern void twrCanvasCharOut(int x, int y, int ch); 
extern int twrCanvasCharIn();
extern int twrCanvasInkey();


