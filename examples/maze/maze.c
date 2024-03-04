/* 
 *  7/22/02 (c) Anthony J. Wood
 *
 * TODO
 *  - Improve 'screen saver' issues:  arrows and text that don't burn in?
 *  - Add option to show cells touched in solution search
 *  - Add my email to setup?  Or add about box?
 *  - Need icon in resouce file (currently using default DOS type icon)
 *  - click on awsoftware.org to bring up web page
 *  - More colorfull mode?
 *  - Super fast mode?
 *  - move resorces for core out of screensaver/
 *  - change draw_cell so it is more effecient
 *  - make my threashold hack more robust... look up in reg, or post a message like close_window
 */

#include <stdlib.h>
#include <time.h>
#include <assert.h>
#include <stdint.h>
#include "maze.h" 
#include "stack.h"
//#include "screensaver/resource.h"

/*
 * settings that determine the look of the maze
 */

unsigned short maze_width_in_cells;
unsigned short maze_height_in_cells;
unsigned short cell_height_in_pixels;
unsigned short cell_width_in_pixels;
unsigned short offset_x;
unsigned short offset_y;
RECT maze_rect;
COLORREF color_mazebackground;
COLORREF color_mazelines;
COLORREF color_solve_try;

unsigned short cell[MAX_MAZE_WIDTH_IN_CELLS][MAX_MAZE_HEIGHT_IN_CELLS];	
//POINT starting_cursor_pos; 
LONG  is_slow_draw;
//extern HINSTANCE hMainInstance;       


/********************************************************/

/*
 * cell size can range from 1 (small) to 10 (large) 
 */

void CalcMazeSizesAndColors(HWND hWnd, LONG cell_size, LONG is_black_bg)
{
	static unsigned short const cs_lookup[]={1000,80,60,50,40,30,20,10,8,5};
	
	GetClientRect(hWnd, &maze_rect);

	/* 
	 * when drawing the maze, it is offset on the left, right, top, and bottom
	 * by the percentages in OFFSET_X (left & right), and OFFSET_Y (top, bottom)
	 */

	if (cell_size == 1)		/* If most complicated maze selected, show no border (fill screen)*/
	{
		offset_x = 0;
		offset_y = 0;
	}
	else
	{
		offset_x = (unsigned short)(((unsigned long)OFFSET_X_PERCENT*(unsigned long)RECT_WIDTH(maze_rect))/100);
		offset_y = (unsigned short)(((unsigned long)OFFSET_Y_PERCENT*(unsigned long)RECT_HEIGHT(maze_rect))/100);
	}

	maze_rect.left +=offset_x;
	maze_rect.right-=offset_x;
	maze_rect.top +=offset_y;
	maze_rect.bottom-=offset_y;

	/*
	 * set maze width and height
	 */
	
	if (cell_size < 1 || cell_size > 10)
		cell_size = 5;

	maze_width_in_cells = cs_lookup[cell_size-1];
	maze_height_in_cells = cs_lookup[cell_size-1];

	/*
	 * calculate the size of each maze cell in pixels
	 * if the calcualted size is too small, set to minimum pixel size and adjust
	 * number of cells in maze to fit.
	 */

	cell_height_in_pixels=RECT_HEIGHT(maze_rect)/maze_height_in_cells;
	if (cell_height_in_pixels < 4)
	{
		cell_height_in_pixels = 4;
		maze_height_in_cells=RECT_HEIGHT(maze_rect)/cell_height_in_pixels;
	}

	cell_width_in_pixels=RECT_WIDTH(maze_rect)/maze_width_in_cells;
	if (cell_width_in_pixels < 4)
	{
		cell_width_in_pixels = 4;
		maze_width_in_cells = RECT_WIDTH(maze_rect)/cell_width_in_pixels;
	}

	if (maze_width_in_cells > MAX_MAZE_WIDTH_IN_CELLS)
		maze_width_in_cells = MAX_MAZE_WIDTH_IN_CELLS;

	if (maze_height_in_cells > MAX_MAZE_HEIGHT_IN_CELLS)
		maze_height_in_cells = MAX_MAZE_HEIGHT_IN_CELLS;

	/* 
	 * Remove any integer math errors by making the maze rect an integer number of pixel*cells
	 */

	maze_rect.right = maze_rect.left+maze_width_in_cells*cell_width_in_pixels;
	maze_rect.bottom = maze_rect.top+maze_height_in_cells*cell_height_in_pixels;

	/*
	 * set up colors
	 */

	if (is_black_bg==0)
	{
		color_mazebackground=COLOR_MAZEBACKGROUND;
		color_mazelines=COLOR_MAZELINES;
	}
	else
	{
		color_mazebackground=COLOR_MAZEBACKGROUND_BLKBG;
		color_mazelines=COLOR_MAZELINES_BLKBG;
	}
	
	color_solve_try=COLOR_SOLVE_TRY;
}

/********************************************************/

void CalcMaze(HWND hWnd, LONG cell_size, LONG is_black_bg, LONG isd)
{
	unsigned short x,y;
	HDC hDC;
	HBRUSH hbr;
	int n;

	/* Initilize */


	CalcMazeSizesAndColors(hWnd, cell_size, is_black_bg);

	srand((unsigned)time(NULL));
	twr_dbg_printf("time=%d\n",time(NULL));

	//GetCursorPos(&starting_cursor_pos);
	is_slow_draw = isd;
	
	for (x=0; x < maze_width_in_cells; x++) {
		for (y=0; y < maze_height_in_cells; y++) {
			cell[x][y]=0;
			}
		}

	/** Clear window, draw arrows **/

	hDC = GetDC(hWnd);
	hbr=CreateSolidBrush(color_mazebackground);
	FillRect(hDC, &maze_rect, hbr);
	DeleteObject(hbr);

	if (offset_y > 35)  /* no room in preview mode or full screen mode*/
	{
		SetTextColor(hDC, RGB(128,128,128));
		SetBkColor(hDC, RGB(0,0,0));
		TextOut(hDC, maze_rect.right-100, maze_rect.bottom + 20, "awsoftware.org",14);
		
		SetTextColor(hDC, RGB(0,0,0));
		SetBkColor(hDC, RGB(255,255,255));
		//DrawMazeImage(hDC, IDB_DNARROW, maze_rect.left+cell_width_in_pixels/2-5, maze_rect.top-15);
		//DrawMazeImage(hDC, IDB_DNARROW, maze_rect.right-cell_width_in_pixels/2-5, maze_rect.bottom + 2);
	}
 
	/** First, draw outline of maze **/
	/** origin is upper left corner, like a pixmap **/

	for (x=0; x < maze_width_in_cells; x++) {
		WallNorth(hDC, x, 0);	 								/* top edge */
		WallSouth(hDC, x, (short)(maze_height_in_cells-1));	/* bottom edge */
		}

	for (y=0; y < maze_height_in_cells; y++) {
		WallWest (hDC, 0, y);									/* Left edge */
		WallEast (hDC, (short)(maze_width_in_cells-1), y);		/* right edge */
		}

	/** Compute maze! **/

	if (MAZE_ABORT==ComputeTrack(hDC, 0, 0, LINE_SOUTH))
	{
		ReleaseDC(hWnd, hDC);
		return;
	}

	/*
	 * Scan each cell.  If a cell has no maze in it (!CELL_DONE), then
	 * Fill in the cell by using it as the start of a new track 
	 */
	
#if 0
	for (y=0; y < maze_height_in_cells; y++) 
		for (x=0; x < maze_width_in_cells; x++) 
			if (!ConnectRndDirTrack(hDC, x, y))
			{
				ReleaseDC(hWnd, hDC);
				return;
			}
#endif

	while ((n = CountCandidateStartCells()))
	{
		GetStartCell(myrnd(n), &x, &y);
		if (!ConnectRndDirTrack(hDC, x, y) /*|| PeekEndScreenSaver()*/)
		{
			ReleaseDC(hWnd, hDC);
			return;
		}
	}

	/** Clear entrance and exit **/

	ClearDir(hDC, 0, 0, LINE_NORTH);
	ClearDir(hDC, (short)(maze_width_in_cells-1), (short)(maze_height_in_cells-1), LINE_SOUTH);

	ReleaseDC(hWnd, hDC);
}

/********************************************************/

int myrnd(int n)
{
	int64_t nbig, tbig, rbig;

	nbig = n;
	rbig = rand();

	tbig = (rbig*nbig)/RAND_MAX;

	return (int)tbig;
}

/********************************************************/

/*
 * a candidate start cell is not marked CELL_DONE (has no maze in it)
 * and is next to another cell that is can connect to
 */

int CountCandidateStartCells(void) 
{
	int k=0;
	short x,y,i;

	for (x=0; x < maze_width_in_cells; x++)
		for (y=0; y < maze_height_in_cells; y++) 
			if (!(cell[x][y]&CELL_DONE) && cell[x][y])
				for (i=0; i < 4; i++)	
					if ((cell[x][y]&(1<<i)) && LegalClear(x, y, (unsigned short)(1<<i)))
					{ 
						k++; 
						break;
					}

	return k;
}


/********************************************************/

void  GetStartCell(int n, unsigned short *x, unsigned short *y)
{
	int k=0;
	unsigned short i;

	for (*x=0; *x < maze_width_in_cells; (*x)++)
		for (*y=0; *y < maze_height_in_cells; (*y)++) 
			if (!(cell[*x][*y]&CELL_DONE) && cell[*x][*y])
				for (i=0; i < 4; i++)	
					if ((cell[*x][*y]&(1<<i)) && LegalClear(*x, *y, (unsigned short)(1<<i)))
					{ 
						k++; 
						if (k>=n)
							return;
						break;
					}
}
	
/********************************************************/

BOOL ConnectRndDirTrack(HDC hDC, unsigned short x, unsigned short y)
{
	unsigned short i, k,not_options, newdir;

	if (!(cell[x][y]&CELL_DONE)) {
		if ((cell[x][y]&0xF)==0xF) {   /* cell that is completely surrounded */
			cell[x][y] |= CELL_DONE;
			if (LegalClear(x,y,LINE_NORTH))
				ClearNorth(hDC, x,y);		/** FIX! **/
			else
				ClearSouth(hDC, x, y);		/** FIX! **/
		}
		else {
			/** Find direction of next track **/
			not_options = 0xF;
			for (i=0; i < 4; i++)  
				if (!((1<<i)&cell[x][y]))
					not_options&= (~(1<<i));
			assert(not_options!=0xF); /* no dir to go in!! */
			newdir = PickRndDir(not_options);

			/** find who it connects from **/
			not_options = 0xF;
			for (k=0; k < 4; k++) {  
				if ((1<<k)&cell[x][y]) 
					if (LegalClear(x,y,(unsigned short)(1<<k))) 
						not_options&= (~(1<<k));
			}
			assert (not_options!=0xF); /* no place to clear!*/

			/* draw new track */
			WallDir(hDC, x, y, ReverseDir(newdir));
			if (MAZE_ABORT==ComputeTrack(hDC, x, y, newdir)) {
				return FALSE;
			}


			/* connect it */
			ClearDir(hDC, x, y, PickRndDir(not_options));	
		}
	}

	return TRUE;
}

/********************************************************/

short LegalClear(short x, short y, unsigned short dir)
{
	if (y==maze_height_in_cells-1 && (dir&LINE_SOUTH))
		return(FALSE);
	if (x==maze_width_in_cells-1 && (dir&LINE_EAST))
		return(FALSE);
	if (y==0 && (dir&LINE_NORTH))
		return(FALSE);
	if (x==0 && (dir&LINE_WEST))
		return(FALSE);
	return(TRUE);
}

/********************************************************/
/* Has a user done something that would end a screen saver? (mousemove, keypress, etc.)
 * Note:  module global starting_cursor_pos must be set prior to this call
 */

BOOL PeekEndScreenSaver(void)
{
#if 0
	MSG msg;

	if (PeekMessage(&msg, 0, WM_CLOSE, WM_QUIT, PM_NOREMOVE))
		return TRUE;

	if (RECT_WIDTH(maze_rect) < 400)  /* don't quit when in preview mode */
		return FALSE;

	if (GetInputState())		// any input message except for MOUSEMOVE
		return TRUE;

//	if (PeekMessage(&msg, 0, WM_MOUSEMOVE, WM_MOUSEMOVE, PM_NOREMOVE))
	{// For some reason, getting WM_MOUSEMOVE with no mouse move
		POINT pt; 
		int dx, dy;

		GetCursorPos(&pt);
		dx = abs(pt.x-starting_cursor_pos.x); 
		dy = abs(pt.y-starting_cursor_pos.y); 
		if (dx>4 || dy>4)	// lookup threshold in registry?
			return TRUE;		
	}
#endif
	return FALSE;
}

/********************************************************/

short ComputeTrack(HDC hDC, short x,short y, unsigned short dir)
{
	short newdir;

	if (is_slow_draw)
	{
		Sleep(10);
	//if (PeekEndScreenSaver())
	//	return MAZE_ABORT;
	}

	/*printf("x %d y %d dir %x\n",x,y,dir);*/
	/*
	kount++;
	if (kount==2) {
		kount=0;
		Delay(1);
		}*/

	/** Mark this cell as allocated **/

	cell[x][y] |= CELL_DONE;

	/** If current dir is blocked, then pick a new one or quit **/

	if (cell[x][y]&dir || rand() < RAND_MAX/3) {/* WAS 3!!  2 & 4 worked pretty good.  Sets how "twisty" they mazeis */	
		newdir = PickNewDir(x, y, dir);	/* returns dir of 0 if no other dir available */
		WallDir(hDC, x, y, dir);
		}
	else {
		newdir = dir;	/** just make non zero **/
		}

	/** Draw sides of cell based on current direction **/

	if (dir&LINE_NORTH || dir&LINE_SOUTH) {
		WallEast(hDC, x, y);
		WallWest(hDC, x, y);
		}
	else if (dir&LINE_EAST || dir&LINE_WEST) {
		WallNorth(hDC, x, y);
		WallSouth(hDC, x, y);
		}

	if (newdir==0) {
		return(CELL_DONE);
		}

	/** Get next x,y based on current direction **/

	ClearDir(hDC, x, y, newdir); /* erase one of the draws above if there was a newdir */
	CalcNewXY(&x,&y,newdir);

	return(ComputeTrack(hDC, x, y, newdir));
}

/********************************************************/

void ClearDir(HDC hDC, short x,short y,unsigned  short dir)
{
	if (dir&LINE_EAST)
		ClearEast(hDC, x, y);
	else if (dir&LINE_WEST)
		ClearWest(hDC, x, y);
	else if (dir&LINE_NORTH)
		ClearNorth(hDC, x, y);
	else if (dir&LINE_SOUTH)
		ClearSouth(hDC, x, y);
}
/********************************************************/

void WallDir(HDC hDC, short x,short y,unsigned  short dir)
{
	if (dir&LINE_EAST)
		WallEast(hDC, x,y);
	else if (dir&LINE_WEST)
		WallWest(hDC, x,y);
	else if (dir&LINE_NORTH)
		WallNorth(hDC, x,y);
	else if (dir&LINE_SOUTH)
		WallSouth(hDC, x,y);
}

/********************************************************/

unsigned short PickNewDir(short x,short y,unsigned short currentdir)
{
	unsigned short not_options;
	
	not_options = cell[x][y]|currentdir|ReverseDir(currentdir);

	if ((not_options&0xF)==0xF)
		return 0;

	return PickRndDir (not_options);

#if 0	
	unsigned  short dir;
	unsigned short revdir;
	unsigned short xxcell;

	revdir = ReverseDir(currentdir);
	xxcell=cell[x][y];
	cell[x][y] |= revdir;
	cell[x][y] |= currentdir;	/** Fource change in dir **/

	if (!(cell[x][y]&LINE_NORTH))
		dir = LINE_NORTH;
	else if (!(cell[x][y]&LINE_SOUTH))
		dir = LINE_SOUTH;
	else if (!(cell[x][y]&LINE_EAST))
		dir = LINE_EAST;
	else if (!(cell[x][y]&LINE_WEST))
		dir = LINE_WEST;
	else
		 dir = 0;
	cell[x][y]=xxcell;
	return(dir);
#endif
}

/********************************************************/

unsigned short ReverseDir(unsigned short dir)
{
	if (dir&LINE_NORTH)
		return(LINE_SOUTH);
	else if (dir&LINE_SOUTH)
		return(LINE_NORTH);
	else if (dir&LINE_EAST)
		return(LINE_WEST);
	else // always if (dir&LINE_WEST)
		return(LINE_EAST);
}

/********************************************************/

unsigned short PickRndDir(unsigned short not_these_dirs)
{
	int r;
	unsigned short newdir;

	assert((not_these_dirs&0xF)!=0xF);

	do {
		r = rand();
		if (r < RAND_MAX/4)
			newdir = LINE_NORTH;
		else if (r < RAND_MAX/2)
			newdir = LINE_SOUTH;
		else if (r < (3*RAND_MAX)/4)
			newdir = LINE_EAST;
		else 
			newdir = LINE_WEST;
	} while ((newdir&not_these_dirs)!=0);

	return newdir;
}


/********************************************************/

void CalcNewXY(short *x,short *y,unsigned short dir)
{
	if (dir&LINE_NORTH)
		(*y)--;
	else if (dir&LINE_SOUTH)
		(*y)++;
	else if (dir&LINE_EAST)
		(*x)++;
	else if (dir&LINE_WEST)
		(*x)--;
}

/********************************************************/

void WallEast(HDC hDC, short x, short y)
{
	cell[x][y] |= LINE_EAST;
	DrawCell(hDC, x, y);
	/** Also need to adjust neighbor **/

	if (x+1 < maze_width_in_cells) {
		cell[x+1][y] |= LINE_WEST;
		DrawCell(hDC, (short)(x+1), y);
		}
}

/********************************************************/

void WallWest(HDC hDC, short x, short y)
{
	cell[x][y] |= LINE_WEST;
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (x-1 >= 0) {
		cell[x-1][y] |= LINE_EAST;
		DrawCell(hDC, (short)(x-1),y);
		}
}

/********************************************************/

void WallSouth(HDC hDC, short x, short y)
{
	cell[x][y] |= LINE_SOUTH;
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (y+1 < maze_height_in_cells) {
		cell[x][y+1] |= LINE_NORTH;
		DrawCell(hDC, x, (short)(y+1));
		}
}

/********************************************************/

void WallNorth(HDC hDC, short x, short y)
{
	cell[x][y] |= LINE_NORTH;
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (y-1 >= 0) {
		cell[x][y-1] |= LINE_SOUTH;
		DrawCell(hDC, x, (short)(y-1));
		}
}


/********************************************************/

void ClearEast(HDC hDC, short x, short y)
{
	cell[x][y] &= (~LINE_EAST);
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (x+1 < maze_width_in_cells) {
		cell[x+1][y] &= (~LINE_WEST);
		DrawCell(hDC, (short)(x+1), y);
		}
}

/********************************************************/

void ClearWest(HDC hDC, short x, short y)
{
	cell[x][y] &= (~LINE_WEST);
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (x-1 >= 0) {
		cell[x-1][y] &= (~LINE_EAST);
		DrawCell(hDC, (short)(x-1),y);
		}
}

/********************************************************/

void ClearSouth(HDC hDC, short x, short y)
{
	cell[x][y] &= (~LINE_SOUTH);
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (y+1 < maze_height_in_cells) {
		cell[x][y+1] &= (~LINE_NORTH);
		DrawCell(hDC, x, (short)(y+1));
		}
}

/********************************************************/

void ClearNorth(HDC hDC, short x,short y)
{
	cell[x][y] &= (~LINE_NORTH);
	DrawCell(hDC, x, y);

	/** Also need to adjust neighbor **/

	if (y-1 >= 0) {
		cell[x][y-1] &= (~LINE_SOUTH);
		DrawCell(hDC, x, (short)(y-1));
		}
}


/********************************************************/
/* Note: Wall width is two pixles (one in each cell) */
void DrawCell(HDC hDC, short x, short y)
{
	DrawCellWithHDC(hDC, x, y, 1, cell_width_in_pixels, cell_height_in_pixels, color_mazebackground);
}

/********************************************************/

void DrawCellWithHDC(
	HDC hDC
	,short x
	,short y
	,short line_width
	,short cell_width
	,short cell_height
	,COLORREF background)
{
	HBRUSH hbr;
	HPEN hpen,hpenold;
	RECT rcell;

	rcell.left=offset_x+x*cell_width;
	rcell.top=offset_y+y*cell_height;
	rcell.right=offset_x+(x+1)*cell_width;
	rcell.bottom=offset_y+(y+1)*cell_height;

	hbr=CreateSolidBrush(background);
	FillRect(hDC, &rcell, hbr);
	DeleteObject(hbr);

	hpen=CreatePen(PS_SOLID, line_width, color_mazelines);
	hpenold=SelectObject(hDC, hpen);

	if (cell[x][y]&LINE_NORTH)
	{
		MoveToEx(hDC, offset_x+x*cell_width, offset_y+y*cell_height, NULL);
		LineTo(hDC, offset_x+(x+1)*(cell_width), offset_y+y*cell_height);
	}

	if (cell[x][y]&LINE_SOUTH) 
	{
		MoveToEx(hDC, offset_x+x*cell_width, offset_y+(y+1)*(cell_height)-1, NULL);
		LineTo(hDC, offset_x+(x+1)*(cell_width), offset_y+(y+1)*(cell_height)-1);
	}

	if (cell[x][y]&LINE_WEST) 
	{
		MoveToEx(hDC, offset_x+x*cell_width, offset_y+y*cell_height, NULL);
		LineTo(hDC, offset_x+x*cell_width, offset_y+(y+1)*(cell_height));
	}

	if (cell[x][y]&LINE_EAST) 
	{
		MoveToEx(hDC, offset_x+(x+1)*(cell_width)-1, offset_y+y*cell_height, NULL);
		LineTo(hDC, offset_x+(x+1)*(cell_width)-1, offset_y+(y+1)*(cell_height));
	}

	SelectObject(hDC, hpenold);
	DeleteObject(hpen);
}

/********************************************************/
#if 0

void PaintMaze(HWND hWnd, PAINTSTRUCT *ps)
{
RECT dummy;
RECT rcell;
short x,y;
     
for (x=0; x < maze_width_in_cells; x++) {
	for (y=0; y < maze_height_in_cells; y++) {
		rcell.left=offset_x+x*cell_width_in_pixels;
		rcell.top=offset_y+y*cell_height_in_pixels;
		rcell.right=offset_x+(x+1)*(cell_width_in_pixels);
		rcell.bottom=offset_y+(y+1)*(cell_height_in_pixels);
		if (IntersectRect(&dummy, &rcell, &ps->rcPaint))
			DrawCell(hWnd, x, y);
        }
	}
}
#endif 

/********************************************************/

void SolveMaze(HWND hWnd)
{
	SolveBegin();
	while (!SolveStep(hWnd)) ;
}

/********************************************************/

static unsigned long next_cell;
static struct Stack stack;

void SolveBegin(void)
{
	cell[0][0]|=TRIED_NORTH;	/* don't try and solve out of the maze */
	InitStack(&stack);
	next_cell = 0;
}

BOOL SolveStep(HWND hwnd)
{


	next_cell=TryCell(hwnd, (unsigned short)(next_cell>>16), (unsigned short)(next_cell&0xFFFF), &stack);
	if (next_cell == MAZE_SOLVED)
		return TRUE;
	else
		return FALSE;
}

/********************************************************/

#define TCRV(x,y) ((x)<<16|(y))

unsigned long TryCell(HWND hWnd, unsigned short x, unsigned short y, struct Stack *s)
{

	/* 
	 * On entry we are passed the cell that contains the new head of the path we
	 * are trying to solve the maze with.
	 *
	 * When moving forward, we are  always exploring cells that have never been touched.
	 * But when backtracking, we are re-touching cells, looking for unexplored exits.
	 *
	 * If this head is a never-before-touched cell, fill it in (to show the user the path), and
	 * handle two special cases:
	 *  (1) maze solved (found last cell)
	 *  (2) dead end.  When there is a dead end, we need to start backtracking on the next call
	 *      to TryCell.  But want to pause for one tick with the deadend cell filled in (for user view).
	 *      In this case, The "TRY_DRAWN"flag is set and we point back to the deadend cell.  The next call
	 *      will  erase and backtrack, becuase there are no unexplored exits.     
	 */

	if (!(cell[x][y]&TRY_DRAWN))
	{
		DrawTryCell(hWnd, x, y, color_solve_try);
		cell[x][y]|=TRY_DRAWN;
	
		/* Is this the solve (last) cell? */

		if (IsMazeSolved(x,y))
			return(MAZE_SOLVED);
		
		/* Is this a dead end? */
		if (NoUnTriedExits(cell[x][y]))
			return TCRV(x,y);
	}

	/*
	 * Find next cell for path head:
	 * As we try each direction, mark it so it is not tried again if we have to backtrack to this cell,
	 * Also push where we are at onto a stack so that we can move back to this cell if we need to backtrack
	 * Also, mark the way back to this cell from the new cell as tried, so we don't try and come back.
	 */

	if (!(cell[x][y]&LINE_EAST) && !(cell[x][y]&TRIED_EAST))
	{
		PushStack(s, x, y);
		cell[x][y]|=TRIED_EAST;
		cell[x+1][y]|=TRIED_WEST;
		return TCRV(x+1, y);
	}
	else if (!(cell[x][y]&LINE_NORTH) && !(cell[x][y]&TRIED_NORTH))
	{
		PushStack(s, x, y);
		cell[x][y]|=TRIED_NORTH;
		cell[x][y-1]|=TRIED_SOUTH;
		return TCRV(x, y-1);
	}
	else if (!(cell[x][y]&LINE_SOUTH) && !(cell[x][y]&TRIED_SOUTH))
	{
		PushStack(s, x, y);
		cell[x][y]|=TRIED_SOUTH;
		cell[x][y+1]|=TRIED_NORTH;
		return TCRV(x, y+1);
	}
	else if (!(cell[x][y]&LINE_WEST) && !(cell[x][y]&TRIED_WEST))
	{
		PushStack(s, x, y);
		cell[x][y]|=TRIED_WEST;
		cell[x-1][y]|=TRIED_EAST;
		return TCRV(x-1, y);
	}
	else /* here if no unexplored exits.  Need to backtrack */
	{
		DrawTryCell(hWnd, x, y, color_mazebackground);    /* erase unsucessfull try  */
		PopStack(s, &x, &y);
		return TCRV(x,y);
	}

	assert(FALSE);	// should never reach here
}
	
	
/********************************************************/

short IsMazeSolved(short x, short y)
{
return((maze_height_in_cells-1)==y && (maze_width_in_cells-1)==x);
}

/********************************************************/

BOOL NoUnTriedExits(unsigned short flags)
{
	return !(
		(!(flags&LINE_EAST)	 && !(flags&TRIED_EAST)) ||
		(!(flags&LINE_NORTH) && !(flags&TRIED_NORTH)) ||
		(!(flags&LINE_SOUTH) && !(flags&TRIED_SOUTH)) ||
		(!(flags&LINE_WEST)  && !(flags&TRIED_WEST))  );
	}
/********************************************************/

void DrawTryCell(HWND hWnd, short x, short y, COLORREF  c)
{
	HDC hDC;

	
	hDC = GetDC(hWnd);
	DrawCellWithHDC(hDC, x, y, 1, cell_width_in_pixels, cell_height_in_pixels, c);
	ReleaseDC(hWnd, hDC);

#if 0
	HBRUSH hbr, hbrold;
	HPEN hpen,hpenold;
	
	hDC = GetDC(hWnd);
	if (cell_width_in_pixels < 10 || cell_height_in_pixels < 10)
	{
		DrawCellWithHDC(hDC, x, y, 1, cell_width_in_pixels, cell_height_in_pixels, c);
	}
	else
	{
		hbr=CreateSolidBrush(c);
		hbrold=SelectObject(hDC, hbr);

		hpen=CreatePen(PS_SOLID, 1, c);
		hpenold=SelectObject(hDC, hpen);

		Ellipse(hDC,offset_x+x*cell_width_in_pixels+2, /* left */
					offset_y+y*cell_height_in_pixels+2, /* top */
					offset_x+x*cell_width_in_pixels+cell_width_in_pixels-3, /* right */
					offset_y+y*cell_height_in_pixels+cell_height_in_pixels-3); /* bottom */

		SelectObject(hDC, hbrold);
		DeleteObject(hbrold);

		SelectObject(hDC, hpenold);
		DeleteObject(hpen);
	}
	ReleaseDC(hWnd, hDC);
#endif

}



/********************************************************/
#if 0
BOOL DrawMazeImage(HDC hdc, UINT resource_id, int x, int y)
{
	HBITMAP hbm;
    BOOL f; 
    HDC hdcBits; 
    BITMAP bm;

	hbm = LoadImage(hMainInstance, (const char*)resource_id, IMAGE_BITMAP, 0, 0, LR_MONOCHROME);

	/* When using BitBlt() to convert a monochrome bitmap to a color bitmap, 
	 * GDI transforms all white bits (1) to the background color of the destination 
	 * device context (DC). GDI transforms all black bits (0) to the text (or foreground) 
	 * color of the destination DC
	 */

    hdcBits = CreateCompatibleDC(hdc); 
    GetObject (hbm, sizeof(BITMAP), &bm); 
    SelectObject(hdcBits,hbm); 
    f = BitBlt(hdc,x,y,bm.bmWidth, bm.bmHeight,hdcBits,0,0,SRCCOPY); 
    DeleteDC(hdcBits); 

	return f;
}
#endif

