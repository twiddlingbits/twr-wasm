#include <assert.h>
#include "canvas.h"


twrCanvas::twrCanvas() {
  m_ds=NULL;
}

void twrCanvas::startDrawSequence(int n) {
  assert(m_ds==NULL);
  m_ds=d2d_start_draw_sequence(n);
  assert(m_ds);
}

void twrCanvas::endDrawSequence() {
  assert(m_ds);
  d2d_end_draw_sequence(m_ds);
  m_ds=NULL;
}

void twrCanvas::beginPath() {
  assert(m_ds);
  d2d_beginpath(m_ds);
}

void twrCanvas::fill() {
  assert(m_ds);
  d2d_fill(m_ds);
}

void twrCanvas::stroke() {
  assert(m_ds);
  d2d_stroke(m_ds);
}

void twrCanvas::setFillStyle(colorRGB color) {
  assert(m_ds);
  assert(color<=0xFFFFFF);
  setFillStyleWithAlpha((color<<8)|0xFF);
}

void twrCanvas::setStrokeStyle(colorRGB color) {
  assert(m_ds);
  assert(color<=0xFFFFFF);
  setStrokeStyleWithAlpha((color<<8)|0xFF);
}

void twrCanvas::setFillStyleWithAlpha(colorRGBA color) {
  assert(m_ds);
  d2d_setfillstyle(m_ds, color);
}

void twrCanvas::setStrokeStyleWithAlpha(colorRGBA color) {
  assert(m_ds);
  d2d_setstrokestyle(m_ds, color);
}

void twrCanvas::setLineWidth(short width) {
  assert(m_ds);
  d2d_setlinewidth(m_ds, width);
}

void twrCanvas::fillRect(short x, short y, short w, short h) {
  assert(m_ds);
  d2d_fillrect(m_ds, x, y, w, h);
}

void twrCanvas::strokeRect(short x, short y, short w, short h) {
  assert(m_ds);
  d2d_strokerect(m_ds, x, y, w, h);
}

void twrCanvas::moveTo(short x, short y) {
  assert(m_ds);
  d2d_moveto(m_ds, x, y);
}

void twrCanvas::lineTo(short x, short y) {
  assert(m_ds);
  d2d_lineto(m_ds, x, y);
}

void twrCanvas::bezierCurveTo(short cp1x, short cp1y, short cp2x, short cp2y, short x, short y) {
  assert(m_ds);
  d2d_bezierto(m_ds, cp1x, cp1y, cp2x, cp2y, x, y);
}

void twrCanvas::arc(short x, short y, short radius, double startAngle, double endAngle, bool counterclockwise) {
  assert(m_ds);
  d2d_arc(m_ds, x, y, radius, startAngle, endAngle, counterclockwise);
}

void twrCanvas::fillText(const char* str, short x, short y) {
  assert(m_ds);
  d2d_filltext(m_ds, str, x, y);
}

void twrCanvas::fillChar(char c, short x, short y) {
  assert(m_ds);
  d2d_fillchar(m_ds, c, x, y);
}

void twrCanvas::imageData(void* start, unsigned long length, unsigned long width, unsigned long height) {
  assert(m_ds);
  d2d_imagedata(m_ds, start, length, width, height);
}

void twrCanvas::putImageData(void* start, unsigned long dx, unsigned long dy) {
  assert(m_ds);
  d2d_putimagedata(m_ds, start, dx, dy);
}

void twrCanvas::putImageData(void* start, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight) {
  assert(m_ds);
  d2d_putimagedatadirty(m_ds, start, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
}

void twrCanvas::setFont(const char* str) {
  assert(m_ds);
  d2d_setfont(m_ds, str);
}

void twrCanvas::save() {
  assert(m_ds);
  d2d_save(m_ds);
}

void twrCanvas::restore() {
  assert(m_ds);
  d2d_restore(m_ds);
}

void twrCanvas::flush() {
  assert(m_ds);
  d2d_flush(m_ds);
}

void twrCanvas::measureText(const char* str, struct d2d_text_metrics *tm) {
  assert(m_ds);

  d2d_measuretext(m_ds, str, tm);
}




