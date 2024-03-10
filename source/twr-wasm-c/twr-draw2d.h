#ifndef __TWR_DRAW2D_H__
#define __TWR_DRAW2D_H__

#ifdef __cplusplus
extern "C" {
#endif

#define D2D_FILLRECT 1
#define D2D_HVLINE 2
#define D2D_TEXT 3
#define D2D_TEXTFILL 4
#define D2D_CHAR 5
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

#define RGB_TO_RGBA(x) ( ((x)<<8) | 0xFF)


struct d2d_instruction_hdr {
    struct d2d_instruction_hdr *next;
    unsigned long type;
};

struct d2dins_fillrect {
    struct d2d_instruction_hdr hdr;
    short x,y,w,h;
};

struct d2dins_filltext {
    struct d2d_instruction_hdr hdr;
    short x,y;
    const char* str;
};

struct d2dins_strokerect {
    struct d2d_instruction_hdr hdr;
    short x,y,w,h;
};

struct d2dins_hvline {
    struct d2d_instruction_hdr hdr;
    short x1,y1,x2,y2;
};

struct d2dins_text {
    struct d2d_instruction_hdr hdr;
    short x,y;
    const char* str;
};

struct d2dins_text_fill {
    struct d2d_instruction_hdr hdr;
    short x,y;
    unsigned long text_color;
    unsigned long back_color;
    unsigned long str_len;
    const char* str;
};

struct d2dins_char {
    struct d2d_instruction_hdr hdr;
    short x,y;
    short c;
};

struct d2dins_setlinewidth {
    struct d2d_instruction_hdr hdr;
    short width;
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

struct d2dins_moveto {
    struct d2d_instruction_hdr hdr;
    short x,y;
};

struct d2dins_lineto {
    struct d2d_instruction_hdr hdr;
    short x,y;
};

struct d2dins_arc {
    struct d2d_instruction_hdr hdr;
    short x,y;
    unsigned long radius;
    double start_angle;
    double end_angle;
    long counterclockwise;
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
    short last_line_width;
};

void d2d_fillrect(struct d2d_draw_seq* ds, short x, short y, short w, short h);
void d2d_strokerect(struct d2d_draw_seq* ds, short x, short y, short w, short h);
void d2d_hvline(struct d2d_draw_seq* ds, short x1, short y1, short x2, short y2);
void d2d_text(struct d2d_draw_seq* ds, short x, short y, const char* str);
void d2d_text_fill(struct d2d_draw_seq* ds, short x, short y, unsigned long text_color, unsigned long back_color, const char* str, int str_len);
void d2d_char(struct d2d_draw_seq* ds, short x, short y, char c);
void d2d_setlinewidth(struct d2d_draw_seq* ds, short width);
void d2d_setstrokestyle(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfillstyle(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfont(struct d2d_draw_seq* ds, const char* font);
struct d2d_draw_seq* d2d_start_draw_sequence(int flush_at_ins_count);
void d2d_end_draw_sequence(struct d2d_draw_seq* ds);
void d2d_flush(struct d2d_draw_seq* ds);
void d2d_beginpath(struct d2d_draw_seq* ds);
void d2d_fill(struct d2d_draw_seq* ds);
void d2d_stroke(struct d2d_draw_seq* ds);
void d2d_moveto(struct d2d_draw_seq* ds, short x, short y);
void d2d_lineto(struct d2d_draw_seq* ds, short x, short y);
void d2d_arc(struct d2d_draw_seq* ds, short x, short y, unsigned long radius, double start_angle, double end_angle, bool counterclockwise);
void d2d_filltext(struct d2d_draw_seq* ds, short x, short y, const char* str);
void d2d_imagedata(struct d2d_draw_seq* ds, void*  start, unsigned long length, unsigned long width, unsigned long height);
void d2d_putimagedata(struct d2d_draw_seq* ds, void* start, unsigned long dx, unsigned long dy);
void d2d_putimagedatadirty(struct d2d_draw_seq* ds, void* start, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);


#ifdef __cplusplus
}
#endif

#endif

