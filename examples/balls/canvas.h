#include <stddef.h>

#include "twr-draw2d.h"

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

typedef unsigned long colorRGB;
typedef unsigned long colorRGBA;

#define CSSCLR_BLUE20 0x72AEE6
#define CSSCLR_WHITE  0xFFFFFF
#define CSSCLR_BLACK  0x000000
#define CSSCLR_GRAY10 0xC3C4C7
#define CSSCLR_GRAY5  0xDCDCDE



class twrCanvas {
  public:
    twrCanvas();
    
    void startDrawSequence(int n=1000);
    void endDrawSequence();

    void beginPath();
    void arc(short x, short y, short radius, double startAngle, double endAngle, bool counterclockwise);
    void moveTo(short x, short y);
    void lineTo(short x, short y);
    void bezierCurveTo(short cp1x, short cp1y, short cp2x, short cp2y, short x, short y);
    void fill();
    void stroke();

    void setFillStyle(colorRGB color);
    void setStrokeStyle(colorRGB color);
    void setFillStyleWithAlpha(colorRGBA color);
    void setStrokeStyleWithAlpha(colorRGBA color);
    void setLineWidth(short width);
    void setFont(const char* str);


    void fillRect(short x, short y, short w, short h);
    void strokeRect(short x, short y, short w, short h);
    void fillText(const char* str, short x, short y);

    void imageData(void* start, unsigned long length, unsigned long width, unsigned long height);
    void putImageData(void* start, unsigned long dx, unsigned long dy);
    void putImageData(void* start, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);


private:
  struct d2d_draw_seq *m_ds;

};
