#include <stdlib.h>

#define D2D_FILLRECT 1
#define D2D_LINE 2
#define D2D_TEXT 3
#define D2D_SETWIDTH 10
#define D2D_SETDRAWCOLOR 11
#define D2D_SETFONT 12

struct d2d_rect {
    struct draw_entry *next;
    short type;
    short x,y,w,h
};

struct d2d_line {
    struct draw_entry *next;
    short type;
    short x1,y1,x2,y2
};

struct d2d_text {
    struct draw_entry *next;
    short type;
    short x,y;
    const char* str;
};

struct d2d_setwidth {
    struct draw_entry *next;
    short type;
    short width;
};

struct d2d_setdrawcolor {
    struct draw_entry *next;
    short type;
    unsigned long color;
};

struct d2d_setfont {
    struct draw_entry *next;
    short type;
    const char* font;
};

struct draw_entry {
    struct draw_entry *next;
    short type;
    union {
        struct d2d_rect rect;
        struct d2d_line line;
        struct d2d_text text;
        struct d2d_setwidth width;
        struct d2d_setdrawcolor color;
        struct d2d_setfont font;
    };
};

#define DRAW2D_SEQENTRIES 50

struct draw_seq {
    struct draw_entry* start;
    struct draw_entry* last;
};

struct draw_seq* start_draw_sequence() {
    struct draw_seq* ds = malloc(sizeof(struct draw_seq));
    ds->last=0;
    ds->start=0;
    return ds;
}

struct draw_seq* end_draw_sequence(struct draw_seq* ds) {
    return ds;
}

static set_ptrs(struct draw_seq* ds, struct draw_entry *e) {
    if (ds->start==0) {
        ds->start=e;
    }
    ds->last=e;
}

void fillrect(struct draw_seq* ds, short x, short y, short w, short h) {
    struct d2d_rect* r= malloc(sizeof(struct d2d_rect));
    r->type=D2D_FILLRECT;
    r->x=x;
    r->y=y;
    r->w=w;
    r->h=h;
    set_ptrs(ds, r);
}

void line(struct draw_seq* ds, short x1, short y1, short x2, short y2) {
    struct d2d_line* e= malloc(sizeof(struct d2d_line));
    e->type=D2D_LINE;
    e->x1=x1;
    e->y1=y1;
    e->x2=x2;
    e->y2=y2;
    set_ptrs(ds, e);
}

/* str must be static */
void text(struct draw_seq* ds, short x, short y, const char* str) {
    struct d2d_text* e= malloc(sizeof(struct d2d_text));
    e->type=D2D_TEXT;
    e->x=x;
    e->y=y;
    e->str=str;
    set_ptrs(ds, e);  
}

void setwidth(struct draw_seq* ds, short width) {
    struct d2d_setwidth* e= malloc(sizeof(struct d2d_setwidth));
    e->type=D2D_SETWIDTH;
    e->width=width;
    set_ptrs(ds, e);  
}

void setdrawcolor(struct draw_seq* ds, unsigned long color) {
    struct d2d_setdrawcolor* e= malloc(sizeof(struct d2d_setdrawcolor));
    e->type=D2D_SETDRAWCOLOR;
    e->color=color;
    set_ptrs(ds, e);  
}

void d2d_setfont(struct draw_seq* ds, const char* font) {
    struct d2d_setfont* e= malloc(sizeof(struct d2d_setfont));
    e->type=D2D_SETFONT;
    e->font=font;
    set_ptrs(ds, e); 
}