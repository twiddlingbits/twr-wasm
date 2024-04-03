# C API - Draw 2D

The tiny-wasm-runtime C D2D API allows you to call many of the Javascript Canvas APIs.  [There is also a C++ wrapper class](https://github.com/twiddlingbits/tiny-wasm-runtime/blob/main/examples/balls/canvas.h) in the balls example.

## Examples
| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/balls) |
| Maze (Win32 C Port) | [View live maze here](/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/maze) |


## Overview

To draw using the C API:
   - call d2d_start_draw_sequence()
   - call draw commands, like d2d_fillrect()
   - call d2d_end_draw_sequence()

 Commands are queued until flush'd, which will take the batch of queued draw cmds, and execute them.  In the case of twrWasmModuleAsync, the batch of commands is sent over to the Javascript main thread for execution. By batching the calls, performance is improved since the transition from a worker thread to a Javascript Main thread is not fast.

 Flush() waits for the commands to finish execution before returning.  Flush() is called automatically by d2d_end_draw_sequence(). 

You pass an argument to d2d_start_draw_sequence() specifying how many instructions will trigger an automatic flush.  You can make this larger for efficiency, or smaller if you want to see the render progress with more frequently.  There is no limit on the size of the queue, except memory used in the wasm module.  There is a flush() function that you can manually call, but it is not normally needed, unless you would like to ensure a sequence renders before d2d_end_draw_sequence() is called, or before the count passed d2d_start_draw_sequence() is met.

If you are using twrWasmModuleAsync, if you are re-rendering the entire frame for each animation update, you should ensure that all of your draws for a single complete frame are made without a call to flush() in the middle of the draw operations, as this may cause flashing.

## Functions
These are the Canvas APIs currently available in C:

~~~
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
void d2d_setfillstylergba(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setstrokestylergba(struct d2d_draw_seq* ds, unsigned long color);
void d2d_setfillstyle(struct d2d_draw_seq* ds, const char* css_color);
void d2d_setstrokestyle(struct d2d_draw_seq* ds, const char* css_color);
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

void d2d_imagedata(struct d2d_draw_seq* ds, long id, void*  mem, unsigned long length, unsigned long width, unsigned long height);
void d2d_putimagedata(struct d2d_draw_seq* ds, long id, unsigned long dx, unsigned long dy);
void d2d_putimagedatadirty(struct d2d_draw_seq* ds, long id, unsigned long dx, unsigned long dy, unsigned long dirtyX, unsigned long dirtyY, unsigned long dirtyWidth, unsigned long dirtyHeight);
~~~

d2d_measuretext() returns this structure:

~~~
struct d2d_text_metrics {
    double actualBoundingBoxAscent;
    double actualBoundingBoxDescent;
    double actualBoundingBoxLeft;
    double actualBoundingBoxRight;
    double fontBoundingBoxAscent;
    double fontBoundingBoxDescent;
    double width;
};
~~~


d2d_get_canvas_prop() returns a value of:

~~~
export interface ICanvasProps {
   charWidth: number,
   charHeight: number,
   foreColor: number,
   backColor: number,
   widthInChars: number,
   heightInChars: number,
   canvasWidth:number,
   canvasHeight:number
}

~~~
