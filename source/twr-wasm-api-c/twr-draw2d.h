#ifndef __TWR_DRAW2D_H__
#define __TWR_DRAW2D_H__

#define D2D_FILLRECT 1
#define D2D_LINE 2
#define D2D_TEXT 3
#define D2D_CHAR 4
#define D2D_SETWIDTH 10
#define D2D_SETDRAWCOLOR 11
#define D2D_SETFONT 12

struct d2d_instruction_hdr {
    struct d2d_instruction_hdr *next;
    short type;
};

struct d2dins_rect {
    struct d2d_instruction_hdr hdr;
    short x,y,w,h;
};

struct d2dins_line {
    struct d2d_instruction_hdr hdr;
    short x1,y1,x2,y2;
};

struct d2dins_text {
    struct d2d_instruction_hdr hdr;
    short x,y;
    const char* str;
};

struct d2dins_char {
    struct d2d_instruction_hdr hdr;
    short x,y;
    short c;
};

struct d2dins_setwidth {
    struct d2d_instruction_hdr hdr;
    short width;
};

struct d2dins_setdrawcolor {
    struct d2d_instruction_hdr hdr;
    unsigned long color;
};

struct d2dins_setfont {
    struct d2d_instruction_hdr hdr;
    const char* font;
};

struct d2d_draw_seq {
    struct d2d_instruction_hdr* start;
    struct d2d_instruction_hdr* last;
};

void d2d_fillrect(struct d2d_draw_seq* ds, short x, short y, short w, short h);
void d2d_line(struct d2d_draw_seq* ds, short x1, short y1, short x2, short y2);
void d2d_text(struct d2d_draw_seq* ds, short x, short y, const char* str);
void d2d_char(struct d2d_draw_seq* ds, short x, short y, char c);
void d2d_setwidth(struct d2d_draw_seq* ds, short width);
void d2d_setdrawcolor(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfont(struct d2d_draw_seq* ds, const char* font);
void d2d_free_sequence(struct d2d_draw_seq* ds);
struct d2d_draw_seq* start_draw_sequence();
void end_draw_sequence(struct d2d_draw_seq* ds);

#endif

