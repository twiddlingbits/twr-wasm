#include <stdlib.h>
#include <assert.h>
#include "twr-crt.h"
#include "twr-wasm.h"
#include "twr-draw2d.h"

void d2d_free_instructions(struct d2d_draw_seq* ds) {
    assert(ds);
    if (ds) {
        struct d2d_instruction_hdr *next=ds->start;

        while (next) {
            //twr_dbg_printf("free instruction me %x type %x next %x\n",next, next->type, next->next);
            struct d2d_instruction_hdr * nextnext=next->next;
            twr_cache_free(next);
            next=nextnext;
        }
        ds->start=0;
        ds->last=0;
    }
}

struct d2d_draw_seq* d2d_start_draw_sequence(int flush_at_ins_count) {
    //twr_dbg_printf("C: d2d_start_draw_sequence\n");
    struct d2d_draw_seq* ds = twr_cache_malloc(sizeof(struct d2d_draw_seq));
    assert(ds);
    ds->last=0;
    ds->start=0;
    ds->ins_count=0;
    ds->last_fillstyle_color_valid=false;
    ds->last_strokestyle_color_valid=false;
    ds->last_line_width=-1;  // invalid value 
    ds->flush_at_ins_count=flush_at_ins_count;
    return ds;
}

void d2d_end_draw_sequence(struct d2d_draw_seq* ds) {
    //twr_dbg_printf("C: end_draw_seq\n");
    d2d_flush(ds);
    if (ds) {  // should never happen -- ie, ds==NULL
        twr_cache_free(ds);
    }
}

void d2d_flush(struct d2d_draw_seq* ds) {
    assert(ds);
    if (ds) {
        if (ds->start) {
            //twr_dbg_printf("do d2d_flush\n");
            twrCanvasDrawSeq(ds);
            d2d_free_instructions(ds); 
        }
    }
}

void new_instruction(struct d2d_draw_seq* ds) {
    //twr_dbg_printf("new_instruction %d %d\n", ds->ins_count, ds->flush_at_ins_count);

    assert(ds);
    ds->ins_count++;
    if (ds->ins_count >= ds->flush_at_ins_count)  {  // if "too big" flush the draw sequence
        ds->ins_count=0;
        d2d_flush(ds);
    }
}

static void set_ptrs(struct d2d_draw_seq* ds, struct d2d_instruction_hdr *e) {
    if (ds->start==0) {
        ds->start=e;
        //twr_dbg_printf("C: set_ptrs start set to %x\n",ds->start);
    }
    e->next=0;
    ds->last->next=e;
    ds->last=e;
    new_instruction(ds);
    //twr_dbg_printf("C: set_ptrs ds->last set to %x\n",ds->last);
}

void d2d_fillrect(struct d2d_draw_seq* ds, short x, short y, short w, short h) {
    struct d2dins_fillrect* r= twr_cache_malloc(sizeof(struct d2dins_fillrect));
    r->hdr.type=D2D_FILLRECT;
    r->x=x;
    r->y=y;
    r->w=w;
    r->h=h;
    set_ptrs(ds, &r->hdr);
    //twr_dbg_printf("C: fillrect,last_fillstyle_color:  %d\n",ds->last_fillstyle_color);
}

void d2d_strokerect(struct d2d_draw_seq* ds, short x, short y, short w, short h) {
    struct d2dins_strokerect* r= twr_cache_malloc(sizeof(struct d2dins_strokerect));
    r->hdr.type=D2D_STROKERECT;
    r->x=x;
    r->y=y;
    r->w=w;
    r->h=h;
    set_ptrs(ds, &r->hdr);
}

void d2d_hvline(struct d2d_draw_seq* ds, short x1, short y1, short x2, short y2) {
    struct d2dins_hvline* e= twr_cache_malloc(sizeof(struct d2dins_hvline));
    e->hdr.type=D2D_HVLINE;
    e->x1=x1;
    e->y1=y1;
    e->x2=x2;
    e->y2=y2;
    set_ptrs(ds, &e->hdr);
}

/* str must be static */
// currently unimplemented in JS side
void d2d_text(struct d2d_draw_seq* ds, short x, short y, const char* str) {
    struct d2dins_text* e= twr_cache_malloc(sizeof(struct d2dins_text));
    e->hdr.type=D2D_TEXT;
    e->x=x;
    e->y=y;
    e->str=str;
    set_ptrs(ds, &e->hdr);  
}

void d2d_text_fill(struct d2d_draw_seq* ds, short x, short y, unsigned long text_color, unsigned long back_color, const char* str, int str_len) {
    struct d2dins_text_fill* e= twr_cache_malloc(sizeof(struct d2dins_text_fill));
    e->hdr.type=D2D_TEXTFILL;
    e->x=x;
    e->y=y;
    e->back_color=back_color;
    e->text_color=text_color;
    e->str=str;
    e->str_len=str_len;
    set_ptrs(ds, &e->hdr);  
}

void d2d_char(struct d2d_draw_seq* ds, short x, short y, char c) {
    struct d2dins_char* e= twr_cache_malloc(sizeof(struct d2dins_char));
    e->hdr.type=D2D_CHAR;
    e->x=x;
    e->y=y;
    e->c=c;
   //twr_dbg_printf("C: d2d_char %d %d %d\n",e->x, e->y, e->c);
    set_ptrs(ds, &e->hdr);  
}

void d2d_setlinewidth(struct d2d_draw_seq* ds, short width) {
    if (ds->last_line_width!=width) {
        ds->last_line_width=width;
        struct d2dins_setlinewidth* e= twr_cache_malloc(sizeof(struct d2dins_setlinewidth));
        e->hdr.type=D2D_SETLINEWIDTH;
        e->width=width;
        set_ptrs(ds, &e->hdr);  
    }
}

void d2d_setfillstyle(struct d2d_draw_seq* ds, unsigned long color) {
    //twr_dbg_printf("C: d2d_setfillstyle %d %d %d\n",color, ds->last_fillstyle_color, color!=ds->last_fillstyle_color);

    if (!(ds->last_fillstyle_color_valid && color==ds->last_fillstyle_color)) {
        ds->last_fillstyle_color=color;
        ds->last_fillstyle_color_valid=true;
        struct d2dins_setfillstyle* e= twr_cache_malloc(sizeof(struct d2dins_setfillstyle));
        e->hdr.type=D2D_SETFILLSTYLE;
        e->color=color;
        //twr_dbg_printf("C: d2d_setfillstyle %d\n",e->color);
        set_ptrs(ds, &e->hdr);  
    }
}

void d2d_setstrokestyle(struct d2d_draw_seq* ds, unsigned long color) {
    //twr_dbg_printf("C: d2d_setstrokestyle %d %d %d\n",color, ds->last_fillstyle_color, color!=ds->last_fillstyle_color);

    if (!(ds->last_strokestyle_color_valid && color==ds->last_strokestyle_color)) {
        ds->last_strokestyle_color=color;
        ds->last_strokestyle_color_valid=true;
        struct d2dins_setstrokestyle* e= twr_cache_malloc(sizeof(struct d2dins_setstrokestyle));
        e->hdr.type=D2D_SETSTROKESTYLE;
        e->color=color;
        //twr_dbg_printf("C: d2d_setstrokestyle %d\n",e->color);
        set_ptrs(ds, &e->hdr);  
    }
}

// currently unimplemented in JS side
void d2d_setfont(struct d2d_draw_seq* ds, const char* font) {
    struct d2dins_setfont* e= twr_cache_malloc(sizeof(struct d2dins_setfont));
    e->hdr.type=D2D_SETFONT;
    e->font=font;
    set_ptrs(ds, &e->hdr); 
}

void d2d_beginpath(struct d2d_draw_seq* ds) {
    struct d2dins_beginpath* e= twr_cache_malloc(sizeof(struct d2dins_beginpath));
    e->hdr.type=D2D_BEGINPATH;
    set_ptrs(ds, &e->hdr); 
}

void d2d_fill(struct d2d_draw_seq* ds) {
    struct d2dins_fill* e= twr_cache_malloc(sizeof(struct d2dins_fill));
    e->hdr.type=D2D_FILL;
    set_ptrs(ds, &e->hdr); 
}

void d2d_stroke(struct d2d_draw_seq* ds) {
    struct d2dins_stroke* e= twr_cache_malloc(sizeof(struct d2dins_stroke));
    e->hdr.type=D2D_STROKE;
    set_ptrs(ds, &e->hdr); 
}

void d2d_moveto(struct d2d_draw_seq* ds, short x, short y) {
    struct d2dins_moveto* e= twr_cache_malloc(sizeof(struct d2dins_moveto));
    e->hdr.type=D2D_MOVETO;
    e->x=x;
    e->y=y;
    set_ptrs(ds, &e->hdr);  
}

void d2d_lineto(struct d2d_draw_seq* ds, short x, short y) {
    struct d2dins_lineto* e= twr_cache_malloc(sizeof(struct d2dins_lineto));
    e->hdr.type=D2D_LINETO;
    e->x=x;
    e->y=y;
    set_ptrs(ds, &e->hdr);  
}

void d2d_arc(struct d2d_draw_seq* ds, short x, short y, unsigned long radius, double start_angle, double end_angle, bool counterclockwise) {
    struct d2dins_arc* e= twr_cache_malloc(sizeof(struct d2dins_arc));
    e->hdr.type=D2D_ARC;
    e->x=x;
    e->y=y;
    e->radius=radius;
    e->start_angle=start_angle;
    e->end_angle=end_angle;
    e->counterclockwise=counterclockwise;
    set_ptrs(ds, &e->hdr);  
}

void d2d_filltext(struct d2d_draw_seq* ds, short x, short y, const char* str) {
    struct d2dins_filltext* e= twr_cache_malloc(sizeof(struct d2dins_filltext));
    e->hdr.type=D2D_FILLTEXT;
    e->x=x;
    e->y=y;
    e->str=str;
    set_ptrs(ds, &e->hdr);
}

void d2d_imagedata(struct d2d_draw_seq* ds, void* start, unsigned long length, unsigned long width, unsigned long height) {
     struct d2dins_image_data* e= twr_cache_malloc(sizeof(struct d2dins_image_data));
    e->hdr.type=D2D_IMAGEDATA;
    e->start=start-(void*)0;
    e->length=length;
    e->width=width;
    e->height=height;
    set_ptrs(ds, &e->hdr); 
}


void d2d_putimagedata(struct d2d_draw_seq* ds, void* start, unsigned long dx, unsigned long dy) {
    d2d_putimagedatadirty(ds, start, dx, dy, 0, 0, 0, 0);
}

void d2d_putimagedatadirty(struct d2d_draw_seq* ds, void* start, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight) {
    struct d2dins_put_image_data* e= twr_cache_malloc(sizeof(struct d2dins_put_image_data));
    e->hdr.type=D2D_PUTIMAGEDATA;
    assert(sizeof(void*)==4);  // ensure 32 bit architecture, 64 bit not supported 
    e->start=start-(void*)0; 
    e->dx=dx;
    e->dy=dy;
    e->dirtyX=dirtyX;
    e->dirtyY=dirtyY;
    e->dirtyWidth=dirtyWidth;
    e->dirtyHeight=dirtyHeight;
    set_ptrs(ds, &e->hdr);
}

