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

void twrCanvas::closePath() {
  assert(m_ds);
  d2d_closepath(m_ds);
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

void twrCanvas::setFillStyleRGB(colorRGB_t color) {
  assert(m_ds);
  assert(color<=0xFFFFFF);
  setFillStyleRGBA((color<<8)|0xFF);
}

void twrCanvas::setStrokeStyleRGB(colorRGB_t color) {
  assert(m_ds);
  assert(color<=0xFFFFFF);
  setStrokeStyleRGBA((color<<8)|0xFF);
}

void twrCanvas::setFillStyleRGBA(colorRGBA_t color) {
  assert(m_ds);
  d2d_setfillstylergba(m_ds, color);
}

void twrCanvas::setStrokeStyleRGBA(colorRGBA_t color) {
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

void twrCanvas::fillCodePoint(unsigned long c, double x, double y) {
  assert(m_ds);
  d2d_fillcodepoint(m_ds, c, x, y);
}

void twrCanvas::strokeText(const char* str, double x, double y) {
  assert(m_ds);
  d2d_stroketext(m_ds, str, x, y);
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

void twrCanvas::reset() {
  assert(m_ds);
  d2d_reset(m_ds);
}

void twrCanvas::clearRect(double x, double y, double w, double h) {
  assert(m_ds);
  d2d_clearrect(m_ds, x, y, w, h);
}

void twrCanvas::scale(double x, double y) {
  assert(m_ds);
  d2d_scale(m_ds, x, y);
}

void twrCanvas::translate(double x, double y) {
  assert(m_ds);
  d2d_translate(m_ds, x, y);
}

void twrCanvas::rotate(double angle) {
  assert(m_ds);
  d2d_rotate(m_ds, angle);
}

void twrCanvas::getTransform(d2d_2d_matrix * transform) {
  assert(m_ds);
  d2d_gettransform(m_ds, transform);
}

void twrCanvas::setTransform(double a, double b, double c, double d, double e, double f) {
  assert(m_ds);
  d2d_settransform(m_ds, a, b, c, d, e, f);
}
void twrCanvas::setTransform(const d2d_2d_matrix * transform) {
  assert(m_ds);
  d2d_settransformmatrix(m_ds, transform);
}

void twrCanvas::resetTransform() {
  assert(m_ds);
  d2d_resettransform(m_ds);
}

void twrCanvas::roundRect(double x, double y, double width, double height, double radii) {
  assert(m_ds);
  d2d_roundrect(m_ds, x, y, width, height, radii);
}

void twrCanvas::ellipse(double x, double y, double radiusX, double radiusY, double rotation, double startAngle, double endAngle, bool counterclockwise) {
  assert(m_ds);
  d2d_ellipse(m_ds, x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
}

void twrCanvas::quadraticCurveTo(double cpx, double cpy, double x, double y) {
  assert(m_ds);
  d2d_quadraticcurveto(m_ds, cpx, cpy, x, y);
}

void twrCanvas::setLineDash(unsigned long len, const double* segments) {
  assert(m_ds);
  d2d_setlinedash(m_ds, len, segments);
}

unsigned long twrCanvas::getLineDash(unsigned long length, double* buffer) {
  assert(m_ds);
  return d2d_getlinedash(m_ds, length, buffer);
}

void twrCanvas::arcTo(double x1, double y1, double x2, double y2, double radius) {
  assert(m_ds);
  d2d_arcto(m_ds, x1, y1, x2, y2, radius);
}

unsigned long twrCanvas::getLineDashLength() {
  assert(m_ds);
  return d2d_getlinedashlength(m_ds);
}


void twrCanvas::drawImage(long id, double dx, double dy) {
  assert(m_ds);
  d2d_drawimage(m_ds, id, dx, dy);
}