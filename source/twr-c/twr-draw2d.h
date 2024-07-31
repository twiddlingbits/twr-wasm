#ifndef __TWR_DRAW2D_H__
#define __TWR_DRAW2D_H__

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

enum D2D_Types {
	D2D_FILLRECT = 1,
	D2D_FILLCODEPOINT = 5,
	D2D_SETLINEWIDTH = 10,
	D2D_SETFILLSTYLERGBA = 11,
	D2D_SETFONT = 12,
	D2D_BEGINPATH = 13,
	D2D_MOVETO = 14,
	D2D_LINETO = 15,
	D2D_FILL = 16,
	D2D_STROKE = 17,
	D2D_SETSTROKESTYLERGBA = 18,
	D2D_ARC = 19,
	D2D_STROKERECT = 20,
	D2D_FILLTEXT = 21,
	D2D_IMAGEDATA = 22,
	D2D_PUTIMAGEDATA = 23,
	D2D_BEZIERTO = 24,
	D2D_MEASURETEXT = 25,
	D2D_SAVE = 26,
	D2D_RESTORE = 27,
	D2D_CREATERADIALGRADIENT = 28,
	D2D_SETCOLORSTOP = 29,
	D2D_SETFILLSTYLEGRADIENT = 30,
	D2D_RELEASEID = 31,
	D2D_CREATELINEARGRADIENT = 32,
	D2D_SETFILLSTYLE = 33,
	D2D_SETSTROKESTYLE = 34,
	D2D_CLOSEPATH = 35,
	D2D_RESET = 36,
    D2D_CLEARRECT = 37,
    D2D_SCALE = 38,
    D2D_TRANSLATE = 39,
    D2D_ROTATE = 40,
    D2D_GETTRANSFORM = 41,
    D2D_SETTRANSFORM = 42,
    D2D_RESETTRANSFORM = 43,
    D2D_STROKETEXT = 44,
    D2D_ROUNDRECT = 45,
    D2D_ELLIPSE = 46,
    D2D_QUADRATICCURVETO = 47,
};

#define RGB_TO_RGBA(x) ( ((x)<<8) | 0xFF)

struct d2d_instruction_hdr {
    struct d2d_instruction_hdr *next;
    unsigned long type;
};

struct d2dins_fillrect {
    struct d2d_instruction_hdr hdr;
    double x,y,w,h;
};

struct d2dins_filltext {
    struct d2d_instruction_hdr hdr;
    double x,y;
    const char* str;
	 int code_page;
};

struct d2dins_fillcodepoint {
    struct d2d_instruction_hdr hdr;
    double x,y;
    unsigned long c;
};

struct d2dins_measuretext {
    struct d2d_instruction_hdr hdr;
    const char* str;
    struct d2d_text_metrics *tm;
	 int code_page;
};

struct d2dins_strokerect {
    struct d2d_instruction_hdr hdr;
    double x,y,w,h;
};

struct d2dins_setlinewidth {
    struct d2d_instruction_hdr hdr;
    double width;
};

struct d2dins_setstrokestylergba {
    struct d2d_instruction_hdr hdr;
    unsigned long color;  // RBGA
};

struct d2dins_setfillstylergba {
    struct d2d_instruction_hdr hdr;
    unsigned long color;   //RGBA
};

struct d2dins_setstrokestyle {
    struct d2d_instruction_hdr hdr;
    const char* css_color;
};

struct d2dins_setfillstyle {
    struct d2d_instruction_hdr hdr;
    const char* css_color;
};

struct d2dins_setfont {
    struct d2d_instruction_hdr hdr;
    const char* font;
};

struct d2dins_beginpath {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_fill {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_stroke {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_save {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_restore {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_moveto {
    struct d2d_instruction_hdr hdr;
    double x,y;
};

struct d2dins_lineto {
    struct d2d_instruction_hdr hdr;
    double x,y;
};

struct d2dins_arc {
    struct d2d_instruction_hdr hdr;
    double x,y;
    double radius;
    double start_angle;
    double end_angle;
    long counterclockwise;
};

struct d2dins_bezierto {
    struct d2d_instruction_hdr hdr;
    double cp1x, cp1y;
    double cp2x, cp2y;
    double x, y;
};

struct d2dins_image_data {
    struct d2d_instruction_hdr hdr;
    unsigned long start;
    unsigned long length;
    unsigned long width;
    unsigned long height;
    long id;
};

struct d2dins_put_image_data {
    struct d2d_instruction_hdr hdr;
    long id;
    unsigned long dx;
    unsigned long dy;
    unsigned long dirtyX;
    unsigned long dirtyY;
    unsigned long dirtyWidth;
    unsigned long dirtyHeight;
};

struct d2dins_create_radial_gradient {
    struct d2d_instruction_hdr hdr;
    double x0;
    double y0;
    double radius0;
    double x1;
    double y1;
    double radius1;
    long id;
};

struct d2dins_create_linear_gradient {
    struct d2d_instruction_hdr hdr;
    double x0;
    double y0;
    double x1;
    double y1;
    long id;
};


struct d2dins_set_color_stop {
    struct d2d_instruction_hdr hdr;
    long id;
    long position;
    const char* csscolor;
};

struct d2dins_set_fillstyle_gradient {
    struct d2d_instruction_hdr hdr;
    long id;
};

struct d2dins_release_id {
    struct d2d_instruction_hdr hdr;
    long id;
};

struct d2dins_closepath {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_reset {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_clearrect {
    struct d2d_instruction_hdr hdr;
    double x,y,w,h;
};

struct d2dins_scale {
    struct d2d_instruction_hdr hdr;
    double x,y;
};

struct d2dins_translate {
    struct d2d_instruction_hdr hdr;
    double x,y;
};

struct d2dins_rotate {
    struct d2d_instruction_hdr hdr;
    double angle;
};

struct d2dins_gettransform {
    struct d2d_instruction_hdr hdr;
    struct d2d_2d_matrix *transform;
};

struct d2dins_settransform {
    struct d2d_instruction_hdr hdr;
    double a, b, c, d, e, f;
};
struct d2dins_resettransform {
    struct d2d_instruction_hdr hdr;
};

struct d2dins_stroketext {
    struct d2d_instruction_hdr hdr;
    double x,y;
    const char* str;
    int code_page;
};

struct d2dins_roundrect {
    struct d2d_instruction_hdr hdr;
    double x, y, width, height, radii;
};

struct d2dins_ellipse {
    struct d2d_instruction_hdr hdr;
    double x, y, radiusX, radiusY, rotation;
    double startAngle, endAngle;
    bool counterclockwise;
};

struct d2dins_quadraticcurveto {
    struct d2d_instruction_hdr hdr;
    double cpx, cpy, x, y;
};

struct d2d_draw_seq {
    struct d2d_instruction_hdr* start;
    struct d2d_instruction_hdr* last;
    int flush_at_ins_count;
    int ins_count;
    unsigned long last_fillstyle_color;
    bool last_fillstyle_color_valid;
    unsigned long last_strokestyle_color;
    bool last_strokestyle_color_valid;
    double last_line_width;
};

struct d2d_text_metrics {
    double actualBoundingBoxAscent;
    double actualBoundingBoxDescent;
    double actualBoundingBoxLeft;
    double actualBoundingBoxRight;
    double fontBoundingBoxAscent;
    double fontBoundingBoxDescent;
    double width;
};

struct d2d_2d_matrix {
    double a, b, c, d, e, f;
};

struct d2d_draw_seq* d2d_start_draw_sequence(int flush_at_ins_count);
void d2d_end_draw_sequence(struct d2d_draw_seq* ds);
void d2d_flush(struct d2d_draw_seq* ds);
int d2d_get_canvas_prop(const char* prop);

void d2d_fillrect(struct d2d_draw_seq* ds, double x, double y, double w, double h);
void d2d_strokerect(struct d2d_draw_seq* ds, double x, double y, double w, double h);
void d2d_filltext(struct d2d_draw_seq* ds, const char* str, double x, double y);
void d2d_fillcodepoint(struct d2d_draw_seq* ds, unsigned long c, double x, double y);
void d2d_stroketext(struct d2d_draw_seq* ds, const char* text, double x, double y);

void d2d_measuretext(struct d2d_draw_seq* ds, const char* str, struct d2d_text_metrics *tm);
void d2d_save(struct d2d_draw_seq* ds);
void d2d_restore(struct d2d_draw_seq* ds);

void d2d_setlinewidth(struct d2d_draw_seq* ds, double width);
void d2d_setstrokestylergba(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfillstylergba(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setstrokestyle(struct d2d_draw_seq* ds, const char* css_color);
void d2d_setfillstyle(struct d2d_draw_seq* ds, const char* css_color);
void d2d_setfont(struct d2d_draw_seq* ds, const char* font);

void d2d_createlineargradient(struct d2d_draw_seq* ds, long id, double x0, double y0, double x1, double y1);
void d2d_createradialgradient(struct d2d_draw_seq* ds, long id, double x0, double y0, double radius0, double x1, double y1, double radius1);
void d2d_addcolorstop(struct d2d_draw_seq* ds, long gradID, long position, const char* csscolor);
void d2d_setfillstylegradient(struct d2d_draw_seq* ds, long gradID);
void d2d_releaseid(struct d2d_draw_seq* ds, long id);

void d2d_beginpath(struct d2d_draw_seq* ds);
void d2d_fill(struct d2d_draw_seq* ds);
void d2d_stroke(struct d2d_draw_seq* ds);
void d2d_moveto(struct d2d_draw_seq* ds, double x, double y);
void d2d_lineto(struct d2d_draw_seq* ds, double x, double y);
void d2d_arc(struct d2d_draw_seq* ds, double x, double y, double radius, double start_angle, double end_angle, bool counterclockwise);
void d2d_bezierto(struct d2d_draw_seq* ds, double cp1x, double cp1y, double cp2x, double cp2y, double x, double y);
void d2d_roundrect(struct d2d_draw_seq* ds, double x, double y, double width, double height, double radii);
void d2d_ellipse(struct d2d_draw_seq* ds, double x, double y, double radiusX, double radiusY, double rotation, double startAngle, double endAngle, bool counterclockwise);
void d2d_quadraticcurveto(struct d2d_draw_seq* ds, double cpx, double cpy, double x, double y);
void d2d_closepath(struct d2d_draw_seq* ds);

void d2d_imagedata(struct d2d_draw_seq* ds, long id, void*  mem, unsigned long length, unsigned long width, unsigned long height);
void d2d_putimagedata(struct d2d_draw_seq* ds, long id, unsigned long dx, unsigned long dy);
void d2d_putimagedatadirty(struct d2d_draw_seq* ds, long id, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);

void d2d_reset(struct d2d_draw_seq* ds);
void d2d_clearrect(struct d2d_draw_seq* ds, double x, double y, double w, double h);
void d2d_scale(struct d2d_draw_seq* ds, double x, double y);
void d2d_translate(struct d2d_draw_seq* ds, double x, double y);
void d2d_rotate(struct d2d_draw_seq* ds, double angle);
void d2d_gettransform(struct d2d_draw_seq* ds, struct d2d_2d_matrix *transform);
void d2d_settransform(struct d2d_draw_seq* ds, double a, double b, double c, double d, double e, double f);
void d2d_settransformmatrix(struct d2d_draw_seq* ds, const struct d2d_2d_matrix * transform);
void d2d_resettransform(struct d2d_draw_seq* ds);

#ifdef __cplusplus
}
#endif

#endif

