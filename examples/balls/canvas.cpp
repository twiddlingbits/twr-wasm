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

void twrCanvas::setFillStyle(const char* cssColor) {
  assert(m_ds);
  assert(cssColor);
  d2d_setfillstyle(m_ds, cssColor);
}

void twrCanvas::setStrokeStyle(const char* cssColor) {
  assert(m_ds);
  assert(cssColor);
  d2d_setstrokestyle(m_ds, cssColor);
}

void twrCanvas::setFillStyleRGB(colorRGB color) {
  assert(m_ds);
  assert(color<=0xFFFFFF);
  setFillStyleRGBA((color<<8)|0xFF);
}

void twrCanvas::setStrokeStyleRGB(colorRGB color) {
  assert(m_ds);
  assert(color<=0xFFFFFF);
  setStrokeStyleRGBA((color<<8)|0xFF);
}

void twrCanvas::setFillStyleRGBA(colorRGBA color) {
  assert(m_ds);
  d2d_setfillstylergba(m_ds, color);
}

void twrCanvas::setStrokeStyleRGBA(colorRGBA color) {
  assert(m_ds);
  d2d_setstrokestylergba(m_ds, color);
}

void twrCanvas::setLineWidth(double width) {
  assert(m_ds);
  d2d_setlinewidth(m_ds, width);
}

void twrCanvas::fillRect(double x, double y, double w, double h) {
  assert(m_ds);
  d2d_fillrect(m_ds, x, y, w, h);
}

void twrCanvas::strokeRect(double x, double y, double w, double h) {
  assert(m_ds);
  d2d_strokerect(m_ds, x, y, w, h);
}

void twrCanvas::moveTo(double x, double y) {
  assert(m_ds);
  d2d_moveto(m_ds, x, y);
}

void twrCanvas::lineTo(double x, double y) {
  assert(m_ds);
  d2d_lineto(m_ds, x, y);
}

void twrCanvas::bezierCurveTo(double cp1x, double cp1y, double cp2x, double cp2y, double x, double y) {
  assert(m_ds);
  d2d_bezierto(m_ds, cp1x, cp1y, cp2x, cp2y, x, y);
}

void twrCanvas::arc(double x, double y, double radius, double startAngle, double endAngle, bool counterclockwise) {
  assert(m_ds);
  d2d_arc(m_ds, x, y, radius, startAngle, endAngle, counterclockwise);
}

void twrCanvas::fillText(const char* str, double x, double y) {
  assert(m_ds);
  d2d_filltext(m_ds, str, x, y);
}

void twrCanvas::fillChar(unsigned long c, double x, double y) {
  assert(m_ds);
  d2d_fillchar(m_ds, c, x, y);
}

void twrCanvas::imageData(long id, void* mem, unsigned long length, unsigned long width, unsigned long height) {
  assert(m_ds);
  d2d_imagedata(m_ds, id, mem, length, width, height);
}

void twrCanvas::putImageData(long id, unsigned long dx, unsigned long dy) {
  assert(m_ds);
  d2d_putimagedata(m_ds, id, dx, dy);
}

void twrCanvas::putImageData(long id, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight) {
  assert(m_ds);
  d2d_putimagedatadirty(m_ds, id, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
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

void twrCanvas::createRadialGradient(long id, double x0, double y0, double radius0, double x1, double y1, double radius1) {
  assert(m_ds);
  d2d_createradialgradient(m_ds, id, x0, y0, radius0, x1, y1, radius1);
}

void twrCanvas::createLinearGradient(long id, double x0, double y0, double x1, double y1) {
  assert(m_ds);
  d2d_createlineargradient(m_ds, id, x0, y0, x1, y1);
}

void twrCanvas::addColorStop(long gradID, long position, const char* cssColor) {
  assert(m_ds);
  d2d_addcolorstop(m_ds, gradID, position, cssColor);
}

void twrCanvas::setFillStyleGradient(long gradID) {
  assert(m_ds);
  d2d_setfillstylegradient(m_ds, gradID);
}

void twrCanvas::releaseID(long id) {
  assert(m_ds);
  d2d_releaseid(m_ds, id);
}





