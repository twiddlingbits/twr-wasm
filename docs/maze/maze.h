/** maze.h **/

/*
 * Settings that define the look of the maze
 */

#include "winemu.h"
#include "stack.h"

#define COLOR_SOLVE_TRY				RGB(128,128,255)
#define COLOR_MAZEBACKGROUND		RGB(255,255,255)
#define COLOR_MAZELINES				RGB(0,0,0)	
#define COLOR_MAZEBACKGROUND_BLKBG	RGB(0,0,0)
#define COLOR_MAZELINES_BLKBG		RGB(255,255,255)

#define MAX_MAZE_WIDTH_IN_CELLS		400
#define MAX_MAZE_HEIGHT_IN_CELLS	400
#define OFFSET_X_PERCENT			15
#define OFFSET_Y_PERCENT			15

#define DEF_BLACK_BK				0
#define DEF_SLOW_DRAW				1
#define DEF_SPEED					5
#define DEF_CELLSIZE				5

/*
 * Helper Macros
  */

#define RECT_HEIGHT(r) (r.bottom - r.top)
#define RECT_WIDTH(r) (r.right - r.left)

/*
 * Cell[][] bits.  Indicate if a wall is set. 
 */

#define LINE_NORTH ((short)(1<<0))
#define LINE_SOUTH ((short)(1<<1))
#define LINE_EAST  ((short)(1<<2))
#define LINE_WEST  ((short)(1<<3))
#define CELL_DONE  ((short)(1<<4))

/*
 * Cell[][] bits. When solving a maze, these bits keep track of directions tried.
 */

#define TRIED_EAST	((short)(1<<5))
#define TRIED_NORTH ((short)(1<<6))
#define TRIED_SOUTH ((short)(1<<7))
#define TRIED_WEST	((short)(1<<8))
#define TRY_DRAWN	((short)(1<<9))


#define MAZE_SOLVED 0xFFFFFFFF
#define MAZE_ABORT  -1

/** protos **/

void  CalcMaze(HWND hWnd, LONG cell_size, LONG is_black_bg, LONG is_slow_draw);
short LegalClear(short x, short y, unsigned short dir);
short ComputeTrack(HDC hDC, short x,short y,unsigned short dir);
void  ClearDir(HDC hDC, short x,short y,unsigned short dir);
void  WallDir(HDC hDC, short x,short y,unsigned short dir);
unsigned short PickNewDir(short x,short y,unsigned short currentdir);
unsigned short ReverseDir(unsigned short dir);
void  CalcNewXY(short *x,short *y,unsigned short dir);
void  WallEast(HDC hDC, short x,short y);
void  WallWest(HDC hDC, short x, short y);
void  WallNorth(HDC hDC, short x, short y);
void  WallSouth(HDC hDC, short x, short y);
void  ClearEast(HDC hDC, short x, short y);
void  ClearWest(HDC hDC, short x, short y);
void  ClearSouth(HDC hDC, short x, short y);
void  ClearNorth(HDC hDC, short x,short y);
void  DrawCell(HDC hDC, short x, short y);
unsigned short myrand(void);
unsigned long TryCell(HWND hWnd, unsigned short x, unsigned short y, struct Stack *);
void SolveMaze(HWND hWnd);
void SolveBegin(void);
BOOL SolveStep(HWND hWnd);
short IsMazeSolved(short x, short y);
BOOL NoUnTriedExits(unsigned short flags);
void DrawTryCell(HWND hWnd, short x, short y, COLORREF c);
void PrintMaze(HWND hWnd);
void DrawCellWithHDC(HDC hDC, short x, short y, short line_width, short , short, COLORREF);
HDC GetPrinterDC (void);
BOOL DrawMazeImage(HDC hdc, UINT resource_id, int x, int y);
unsigned short PickRndDir(unsigned short not_these_dirs);
BOOL ConnectRndDirTrack(HDC hDC, unsigned short x, unsigned short y);
void GetStartCell(int n, unsigned short *x, unsigned short *y);
int CountCandidateStartCells(void);
int myrnd(int n);

