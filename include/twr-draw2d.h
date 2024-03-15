#ifndef __TWR_DRAW2D_H__
#define __TWR_DRAW2D_H__

#ifdef __cplusplus
extern "C" {
#endif

#define D2D_FILLRECT 1
#define D2D_FILLCHAR 5
#define D2D_SETLINEWIDTH 10
#define D2D_SETFILLSTYLE 11
#define D2D_SETFONT 12
#define D2D_BEGINPATH 13
#define D2D_MOVETO 14
#define D2D_LINETO 15
#define D2D_FILL 16
#define D2D_STROKE 17
#define D2D_SETSTROKESTYLE 18
#define D2D_ARC 19
#define D2D_STROKERECT 20
#define D2D_FILLTEXT 21
#define D2D_IMAGEDATA 22
#define D2D_PUTIMAGEDATA 23
#define D2D_BEZIERTO 24
#define D2D_MEASURETEXT 25
#define D2D_SAVE 26
#define D2D_RESTORE 27


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
};

struct d2dins_fillchar {
    struct d2d_instruction_hdr hdr;
    double x,y;
    short c;
};

struct d2dins_measuretext {
    struct d2d_instruction_hdr hdr;
    const char* str;
    struct d2d_text_metrics *tm;
};

struct d2dins_strokerect {
    struct d2d_instruction_hdr hdr;
    double x,y,w,h;
};

struct d2dins_setlinewidth {
    struct d2d_instruction_hdr hdr;
    double width;
};

struct d2dins_setstrokestyle {
    struct d2d_instruction_hdr hdr;
    unsigned long color;  // RBGA
};

struct d2dins_setfillstyle {
    struct d2d_instruction_hdr hdr;
    unsigned long color;   //RGBA
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
};

struct d2dins_put_image_data {
    struct d2d_instruction_hdr hdr;
    unsigned long start;
    unsigned long dx;
    unsigned long dy;
    unsigned long dirtyX;
    unsigned long dirtyY;
    unsigned long dirtyWidth;
    unsigned long dirtyHeight;
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

struct d2d_draw_seq* d2d_start_draw_sequence(int flush_at_ins_count);
void d2d_end_draw_sequence(struct d2d_draw_seq* ds);
void d2d_flush(struct d2d_draw_seq* ds);
int d2d_get_canvas_prop(const char* prop);

void d2d_fillrect(struct d2d_draw_seq* ds, double x, double y, double w, double h);
void d2d_strokerect(struct d2d_draw_seq* ds, double x, double y, double w, double h);
void d2d_filltext(struct d2d_draw_seq* ds, const char* str, double x, double y);
void d2d_fillchar(struct d2d_draw_seq* ds, char c, double x, double y);

void d2d_measuretext(struct d2d_draw_seq* ds, const char* str, struct d2d_text_metrics *tm);
void d2d_save(struct d2d_draw_seq* ds);
void d2d_restore(struct d2d_draw_seq* ds);

void d2d_setlinewidth(struct d2d_draw_seq* ds, double width);
void d2d_setstrokestyle(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfillstyle(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfont(struct d2d_draw_seq* ds, const char* font);

void d2d_beginpath(struct d2d_draw_seq* ds);
void d2d_fill(struct d2d_draw_seq* ds);
void d2d_stroke(struct d2d_draw_seq* ds);
void d2d_moveto(struct d2d_draw_seq* ds, double x, double y);
void d2d_lineto(struct d2d_draw_seq* ds, double x, double y);
void d2d_arc(struct d2d_draw_seq* ds, double x, double y, double radius, double start_angle, double end_angle, bool counterclockwise);
void d2d_bezierto(struct d2d_draw_seq* ds, double cp1x, double cp1y, double cp2x, double cp2y, double x, double y);

void d2d_imagedata(struct d2d_draw_seq* ds, void*  start, unsigned long length, unsigned long width, unsigned long height);
void d2d_putimagedata(struct d2d_draw_seq* ds, void* start, unsigned long dx, unsigned long dy);
void d2d_putimagedatadirty(struct d2d_draw_seq* ds, void* start, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);

#ifdef __cplusplus
}
#endif

#endif

