#include <stdlib.h>
#include <assert.h>
#include <twr-wasm.h>

#include "twr-draw2d.h"

void d2d_free_instructions(struct d2d_draw_seq* ds) {
    assert(ds);
    if (ds) {
        struct d2d_instruction_hdr *next=ds->start;

        while (next) {
            //io_printf(twr_wasm_get_debugcon(),"free instruction me %x type %x next %x\n",next, next->type, next->next);
            struct d2d_instruction_hdr * nextnext=next->next;
            free(next);
            next=nextnext;
        }
        ds->start=0;
        ds->last=0;
    }
}

struct d2d_draw_seq* d2d_start_draw_sequence(int flush_at_ins_count) {
    //io_printf(twr_wasm_get_debugcon(),"C: d2d_start_draw_sequence\n");
    struct d2d_draw_seq* ds = malloc(sizeof(struct d2d_draw_seq));
    assert(ds);
    ds->last=0;
    ds->start=0;
    ds->ins_count=0;
    ds->last_draw_color=0xFFFFFFFF;  // not a real color
    ds->flush_at_ins_count=flush_at_ins_count;
    return ds;
}

void d2d_end_draw_sequence(struct d2d_draw_seq* ds) {
    //io_printf(twr_wasm_get_debugcon(),"C: end_draw_seq\n");
    d2d_flush(ds);
    if (ds) {  // should never happen -- ie, ds==NULL
        free(ds);
    }
}

void d2d_flush(struct d2d_draw_seq* ds) {
    assert(ds);
    if (ds) {
        if (ds->start) {
            //twr_wasm_dbg_printf("do d2d_flush\n");
            twrCanvasDrawSeq(ds);
            d2d_free_instructions(ds); 
        }
    }
}

void new_instruction(struct d2d_draw_seq* ds) {
    //twr_wasm_dbg_printf("new_instruction %d %d\n", ds->ins_count, ds->flush_at_ins_count);

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
        //io_printf(twr_wasm_get_debugcon(),"C: set_ptrs start set to %x\n",ds->start);
    }
    e->next=0;
    ds->last->next=e;
    ds->last=e;
    new_instruction(ds);
    //io_printf(twr_wasm_get_debugcon(),"C: set_ptrs ds->last set to %x\n",ds->last);
}

void d2d_fillrect(struct d2d_draw_seq* ds, short x, short y, short w, short h) {
    struct d2dins_rect* r= malloc(sizeof(struct d2dins_rect));
    r->hdr.type=D2D_FILLRECT;
    r->x=x;
    r->y=y;
    r->w=w;
    r->h=h;
    set_ptrs(ds, &r->hdr);
    //io_printf(twr_wasm_get_debugcon(),"C: fillrect,last_draw_color:  %d\n",ds->last_draw_color);

}

void d2d_hvline(struct d2d_draw_seq* ds, short x1, short y1, short x2, short y2) {
    struct d2dins_hvline* e= malloc(sizeof(struct d2dins_hvline));
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
    struct d2dins_text* e= malloc(sizeof(struct d2dins_text));
    e->hdr.type=D2D_TEXT;
    e->x=x;
    e->y=y;
    e->str=str;
    set_ptrs(ds, &e->hdr);  
}

void d2d_text_fill(struct d2d_draw_seq* ds, short x, short y, unsigned long text_color, unsigned long back_color, const char* str, int str_len) {
    struct d2dins_text_fill* e= malloc(sizeof(struct d2dins_text_fill));
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
    struct d2dins_char* e= malloc(sizeof(struct d2dins_char));
    e->hdr.type=D2D_CHAR;
    e->x=x;
    e->y=y;
    e->c=c;
   // io_printf(twr_wasm_get_debugcon(),"C: d2d_char %d %d %d\n",e->x, e->y, e->c);
    set_ptrs(ds, &e->hdr);  
}

void d2d_setwidth(struct d2d_draw_seq* ds, short width) {
    if (ds->last_width!=width) {
        ds->last_width=width;
        struct d2dins_setwidth* e= malloc(sizeof(struct d2dins_setwidth));
        e->hdr.type=D2D_SETWIDTH;
        e->width=width;
        set_ptrs(ds, &e->hdr);  
    }
}

void d2d_setdrawcolor(struct d2d_draw_seq* ds, unsigned long color) {
    //io_printf(twr_wasm_get_debugcon(),"C: setdrawcolor %d %d %d\n",color, ds->last_draw_color, color!=ds->last_draw_color);

    if (color!=ds->last_draw_color) {
        ds->last_draw_color=color;
        struct d2dins_setdrawcolor* e= malloc(sizeof(struct d2dins_setdrawcolor));
        e->hdr.type=D2D_SETDRAWCOLOR;
        e->color=color;
        //io_printf(twr_wasm_get_debugcon(),"C: setdrawcolor %d\n",e->color);
        set_ptrs(ds, &e->hdr);  
    }
}

// currently unimplemented in JS side
void d2d_setfont(struct d2d_draw_seq* ds, const char* font) {
    struct d2dins_setfont* e= malloc(sizeof(struct d2dins_setfont));
    e->hdr.type=D2D_SETFONT;
    e->font=font;
    set_ptrs(ds, &e->hdr); 
}

