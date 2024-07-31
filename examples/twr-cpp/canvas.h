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
    void roundRect(double x, double y, double width, double height, double radii);
    void ellipse(double x, double y, double radiusX, double radiusY, double rotation, double startAngle, double endAngle, bool counterclockwise = false);
    void quadraticCurveTo(double cpx, double cpy, double x, double y);
    void closePath();

    void save();
    void restore();
    void measureText(const char* str, struct d2d_text_metrics *tm);

    void setFillStyleRGB(colorRGB color);
    void setStrokeStyleRGB(colorRGB color);
    void setFillStyleRGBA(colorRGBA color);
    void setStrokeStyleRGBA(colorRGBA color);
    void setFillStyle(const char* cssColor);
    void setStrokeStyle(const char* cssColor);
    void setLineWidth(double width);
    void setFont(const char* str);

    void createLinearGradient(long id, double x0, double y0, double x1, double y1);
    void createRadialGradient(long id, double x0, double y0, double radius0, double x1, double y1, double radius1);
    void addColorStop(long gradID, long position, const char* color);
    void setFillStyleGradient(long gradID);
    void releaseID(long id);

    void fillRect(double x, double y, double w, double h);
    void strokeRect(double x, double y, double w, double h);
    void fillText(const char* str, double x, double y);
    void fillCodePoint(unsigned long c, double x, double y);
    void strokeText(const char* str, double x, double y);

    void imageData(long id, void* mem, unsigned long length, unsigned long width, unsigned long height);
    void putImageData(long id, unsigned long dx, unsigned long dy);
    void putImageData(long id, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);

    void reset();
    void clearRect(double x, double y, double w, double h);
    void scale(double x, double y);
    void translate(double x, double y);
    void rotate(double angle);
    void getTransform(d2d_2d_matrix * transform);
    void setTransform(double a, double b, double c, double d, double e, double f);
    void setTransform(const d2d_2d_matrix * transform);
    void resetTransform();
private:
  struct d2d_draw_seq *m_ds;

};
