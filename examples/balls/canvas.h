#include <stddef.h>

#include "twr-draw2d.h"

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

typedef unsigned long typeColor;

class twrCanvas {
  public:
    twrCanvas();
    void startDrawSequence(int n=1000);
    void endDrawSequence();
    void beginPath();
    void fill();
    void stroke();
    void setFillStyle(typeColor color);
    void setStrokeStyle(typeColor color);
    void setLineWidth(short width);
    void fillRect(short x, short y, short w, short h);
    void strokeRect(short x, short y, short w, short h);
    void arc(short x, short y, short radius, double startAngle, double endAngle, bool counterclockwise);
    void moveTo(short x, short y);
    void lineTo(short x, short y);
    void fillText(short x, short y, const char* str);

private:
  struct d2d_draw_seq *m_ds;

};
