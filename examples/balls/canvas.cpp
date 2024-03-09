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

void twrCanvas::setFillStyle(typeColor color) {
  assert(m_ds);
  d2d_setfillstyle(m_ds, color);
}

void twrCanvas::setStrokeStyle(typeColor color) {
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

void twrCanvas::arc(short x, short y, short radius, double startAngle, double endAngle, bool counterclockwise) {
  assert(m_ds);
  d2d_arc(m_ds, x, y, radius, startAngle, endAngle, counterclockwise);
}

void twrCanvas::fillText(short x, short y, const char* str) {
  assert(m_ds);
  d2d_filltext(m_ds, x, y, str);
}
