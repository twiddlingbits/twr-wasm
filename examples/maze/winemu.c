#include <assert.h>
#include <stdlib.h>
#include "winemu.h"


struct tagHDC myHDC;

HDC GetDC(HWND hWnd) {
    //twr_dbg_printf("Enter GetDC\n");

    myHDC.back_color=RGB(0,0,0);
    myHDC.fill_color=RGB(0,0,0);
    myHDC.text_color=RGB(255,255,255);
    myHDC.pen=0;
    myHDC.x=0;
    myHDC.y=0;
    myHDC.ds=d2d_start_draw_sequence(10);
    myHDC.draw_count=0;
    return &myHDC;
}

void ReleaseDC(HWND hWnd, HDC hdc) {
    //twr_dbg_printf("Enter Release GetDC\n");

    assert(hdc->ds);
    d2d_end_draw_sequence(hdc->ds);
    hdc->ds=0;
}

HBRUSH CreateSolidBrush(COLORREF color) {

    COLORREF* mem=malloc(sizeof(COLORREF));
    *mem=color;
    //twr_dbg_printf("Did CreateSolidBrush %x\n",mem);
    return mem;
}

// HBRUSH and HPEN can currently be deleted
BOOL DeleteObject(HGDIOBJ ho) {
    //twr_dbg_printf("Enter DeleteObject %x\n",ho);
    if (ho) {
        free(ho);
        return TRUE;
    }
    else {
        return FALSE;
    }
}
// includes the left and top borders, but excludes the right and bottom borders of the rectangle.
int FillRect(HDC hdc, const RECT *lprc, HBRUSH hbr) {
    //twr_dbg_printf("Enter FillRect ds->last %x\n",hdc->ds->last);

    d2d_setfillstylergba(hdc->ds, RGB_TO_RGBA(*hbr));
    d2d_fillrect(hdc->ds, lprc->left, lprc->top, lprc->right-lprc->left, lprc->bottom-lprc->top);
    return 1;
}

//The SelectObject function selects an object into the specified device context (DC). The new object replaces the previous object of the same type.
//This function returns the previously selected object of the specified type. An application should always replace a new object with the original, 
// default object after it has finished drawing with the new object.
//
// only support HPEN
HGDIOBJ SelectObject(HDC hdc, HGDIOBJ h) {
    //twr_dbg_printf("Enter SelectObject %x\n",h);

    HPEN oldpen=hdc->pen;
    hdc->pen=h;
    return oldpen;
}

COLORREF SetTextColor(HDC  hdc, COLORREF color) {
    //twr_dbg_printf("Enter SetTextColor %x\n", color);

    COLORREF old=hdc->text_color;
    hdc->text_color=color;
    return old;
}

COLORREF SetBkColor(HDC  hdc, COLORREF color) {
    //twr_dbg_printf("Enter SetBkColor %x\n", color);
    COLORREF old=hdc->back_color;
    hdc->back_color=color;
    return old;
}

//The TextOut function writes a character string at the specified location, using the currently selected font, background color, and text color
//The string does not need to be zero-terminated, because cchString specifies the length of the string.
BOOL TextOut(HDC hdc, int x, int y, LPCSTR lpString, int c) {
    struct d2d_text_metrics tm;

    d2d_save(hdc->ds);
    d2d_setfillstylergba(hdc->ds, RGB_TO_RGBA(hdc->back_color));
    d2d_measuretext(hdc->ds, lpString, &tm);
    d2d_fillrect(hdc->ds, x, y, (short)tm.width, (short)(tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent));
    d2d_setfillstylergba(hdc->ds, RGB_TO_RGBA(hdc->text_color));
    d2d_filltext(hdc->ds, lpString, x, y);
    d2d_restore(hdc->ds);

    return TRUE;
};

//Retrieves the coordinates of a window's client area. The client coordinates specify the upper-left and lower-right corners of the client area. 
//Because client coordinates are relative to the upper-left corner of a window's client area, 
//the coordinates of the upper-left corner are (0,0).
BOOL GetClientRect(HWND hWnd, LPRECT lpRect) {
    
    lpRect->left=0;
    lpRect->top=0;
    lpRect->right=twrCanvasGetProp("canvasWidth")-1;
    lpRect->bottom=twrCanvasGetProp("canvasHeight")-1;

    assert(lpRect->right>0);
    assert(lpRect->bottom>0);

    //twr_dbg_printf("Done GetClientRect: %d %d\n", lpRect->right, lpRect->bottom);

    return TRUE;
}

// only supports PS_SOLID iStyle
//cWidth the width of the pen, in logical units. If nWidth is zero, the pen is a single pixel wide, regardless of the current transformation.

HPEN CreatePen(int iStyle, int cWidth, COLORREF color) {

    assert(iStyle==PS_SOLID);
    HPEN mem=malloc(sizeof(struct tagHPEN));
    mem->color=color;
    mem->width=cWidth;

    //twr_dbg_printf("Did CreatePen: %x\n",mem);

    return mem;
}

//The MoveToEx function updates the current position to the specified point and optionally returns the previous position(if lppt is non NULL)
BOOL MoveToEx(HDC hdc, int x, int y, LPPOINT lppt) {
    //twr_dbg_printf("Enter MoveTo: %d %d \n",x,y);

    if (lppt) {
        lppt->x=hdc->x;
        lppt->y=hdc->y;
    }
    hdc->x=x;
    hdc->y=y;

    return TRUE;
}

//The LineTo function draws a line from the current position up to, but not including, the specified point.
BOOL LineTo( HDC hdc, const int x2, const int y2 ) {
    //twr_dbg_printf("Enter LineTo: %d %d \n",x,y);

    assert(hdc->x==x2 || hdc->y==y2);  // currently only supports horizontal or vertical lines
    assert(x2>=hdc->x && y2>=hdc->y);  // currently only support lines to right or down
    assert(hdc->pen->width==1);     // currently only support linewidth of 1 px


    const int x=hdc->x;
    const int y=hdc->y;

    d2d_setstrokestylergba(hdc->ds, RGB_TO_RGBA(hdc->pen->color));
    d2d_beginpath(hdc->ds);

    if (x==x2) { // single pixel width vertical line
        d2d_moveto(hdc->ds, (double)x+0.5, (double)y);
        d2d_lineto(hdc->ds, (double)x2+0.5, (double)y2);
    }
    else if (y==y2) { // single pixel width horizontal line
        d2d_moveto(hdc->ds, (double)x, (double)y+0.5);
        d2d_lineto(hdc->ds, (double)x2, (double)y2+0.5);
    }
    else {  // this actually does include the last point
       assert(0);
    }
    d2d_stroke(hdc->ds);

    return TRUE;
}


void Sleep(DWORD dwMilliseconds) {
    twr_wasm_sleep(dwMilliseconds);
}

