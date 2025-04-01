#ifndef __WINEMU_H__
#define __WINEMU_H__

#include <stdbool.h>
#include <stddef.h>

#include "twr-draw2d.h"

#ifndef BOOL
#define BOOL	bool
#endif

#ifndef TRUE
#define TRUE	true
#endif

#ifndef FALSE
#define FALSE	false
#endif

typedef unsigned int UINT;
typedef long LONG;
typedef unsigned long DWORD;

typedef unsigned long COLORREF;  // RBG format (NOT RGBA)

typedef COLORREF * HBRUSH;

#define RGB(r,g,b) ( ((unsigned long)r)<<16 | ((unsigned long)g)<<8 | ((unsigned long)b) )

typedef char* LPSTR;
//typedef __nullterminated CONST CHAR *LPCSTR;
typedef const char* LPCSTR;

typedef struct tagPOINT {
  LONG x;
  LONG y;
} POINT, *LPPOINT;

typedef struct tagRECT {
  LONG left;
  LONG top;
  LONG right;
  LONG bottom;
} RECT, *LPRECT;

#define PS_SOLID 1

typedef void* HWND;

typedef void* HGDIOBJ;

typedef struct tagHPEN {
  COLORREF color;
  int width;
} * HPEN;

struct tagHDC {
  struct d2d_draw_seq* ds;
  HPEN pen;
  COLORREF fill_color;
  COLORREF text_color;
  COLORREF back_color;
  int x,y;
  int draw_count;
};

typedef struct tagHDC * HDC;

void Sleep(DWORD dwMilliseconds);
HDC GetDC(HWND hWnd);
void ReleaseDC(HWND hWnd, HDC hDC);
HBRUSH CreateSolidBrush(COLORREF color);
BOOL DeleteObject(HGDIOBJ ho);
int FillRect(HDC hDC, const RECT *lprc, HBRUSH hbr);
HPEN CreatePen(int iStyle, int cWidth, COLORREF color);
COLORREF SetTextColor(HDC  hdc, COLORREF color);
COLORREF SetBkColor(HDC  hdc, COLORREF color);
BOOL TextOut(HDC hdc, int x, int y, LPCSTR lpString, int c);
BOOL GetClientRect(HWND hWnd, LPRECT lpRect);
HGDIOBJ SelectObject(HDC hdc, HGDIOBJ h);
BOOL MoveToEx(HDC hdc, int x, int y, LPPOINT lppt);
BOOL LineTo( HDC hdc, int x, int y );

#endif
