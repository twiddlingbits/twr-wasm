#include "canvas.h"

void drawAsHeart(twrCanvas& canvas, short x, short y) {
    canvas.beginPath();
    canvas.setFillStyleRGB(CSSCLR_GRAY10);
    canvas.moveTo(x, y);
    canvas.bezierCurveTo(x, y-40+37, x-75+70, y-40+25, x-75+50, y-40+25);
    canvas.bezierCurveTo(x+20-75, y-40+25, x-75+20, y-40+62.5, x-75+20, y-40+62.5);
    canvas.bezierCurveTo(x+20-75, y-40+80, x-75+40, y-40+102, x-75+75, y-40+120);
    canvas.bezierCurveTo(x+110-75, y-40+102, x-75+130, y-40+80, x-75+130, y-40+62.5);
    canvas.bezierCurveTo(x+130-75, y-40+62.5, x-75+130, y-40+25, x-75+100, y-40+25);
    canvas.bezierCurveTo(x+10, y-40+25, x, y-40+37, x, y-40+40);
    canvas.fill();
}
