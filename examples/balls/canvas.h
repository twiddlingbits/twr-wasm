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
    void flush();

    void beginPath();
    void arc(double x, double y, double radius, double startAngle, double endAngle, bool counterclockwise);
    void moveTo(double x, double y);
    void lineTo(double x, double y);
    void bezierCurveTo(double cp1x, double cp1y, double cp2x, double cp2y, double x, double y);
    void fill();
    void stroke();

    void save();
    void restore();
    void measureText(const char* str, struct d2d_text_metrics *tm);

    void setFillStyleRGB(colorRGB color);
    void setStrokeStyleRGB(colorRGB color);
    void setFillStyleRGBA(colorRGBA color);
    void setStrokeStyleRGBA(colorRGBA color);
    void setLineWidth(double width);
    void setFont(const char* str);

    void fillRect(double x, double y, double w, double h);
    void strokeRect(double x, double y, double w, double h);
    void fillText(const char* str, double x, double y);
    void fillChar(char c, double x, double y);

    void imageData(void* start, unsigned long length, unsigned long width, unsigned long height);
    void putImageData(void* start, unsigned long dx, unsigned long dy);
    void putImageData(void* start, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);

private:
  struct d2d_draw_seq *m_ds;

};
