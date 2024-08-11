#ifndef __TWR_IO_H__
#define __TWR_IO_H__

#include <_stdtypes.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

/* 
 * The IoConsole abstracts input/output
 */

struct IoConsole;
struct IoConsoleWindow;

typedef struct IoConsole twr_ioconsole_t;

// match with class IOTypes in twrcon.ts
// multiple of these flags can be combined to enumerate the device capabilities
#define IO_TYPE_CHARREAD  (1<<0)  // Stream In
#define IO_TYPE_CHARWRITE (1<<1)  // Stream Out
#define IO_TYPE_ADDRESSABLE_DISPLAY  (1<<2)  	// IoDisplay is enabled
#define IO_TYPE_WINDOW  (IO_TYPE_ADDRESSABLE_DISPLAY)  	// deprecated
#define IO_TYPE_CANVAS2D (1<<3)   // unimplemented yet
#define IO_TYPE_EVENTS (1<<4)  // unimplemented yet

struct IoConsoleHeader {
   unsigned long type; 
   void (*io_close)  (twr_ioconsole_t*);
   int  (*io_chk_brk)(twr_ioconsole_t*);
   int (*io_get_prop)(twr_ioconsole_t *, const char* key);
};

struct IoCharRead {
   int (*io_getc32)(twr_ioconsole_t *);
   void (*io_setfocus)(twr_ioconsole_t*);
   char (*io_inkey)(twr_ioconsole_t*);
};

struct IoCharWrite {
   void (*io_putc)(twr_ioconsole_t*, unsigned char);
   void (*io_putstr)(twr_ioconsole_t*, const char *);
};

struct IoDisplay {
   int width, height;
   void (*io_cls)(twr_ioconsole_t *);
   void (*io_setc32)(twr_ioconsole_t *, int location, int c32);
   void (*io_setreset)(twr_ioconsole_t *, int x, int y, bool isset);
   bool (*io_point)(twr_ioconsole_t *, int x, int y);
   void (*io_set_cursor)(twr_ioconsole_t *, int position);
   void (*io_set_colors)(twr_ioconsole_t *, unsigned long foreground, unsigned long background);
   void (*io_set_range)(twr_ioconsole_t *, int *chars32, int start, int len);
};

struct IoConsole {
   struct IoConsoleHeader header;  	
   struct IoCharRead charin;  			
   struct IoCharWrite charout;	
   struct IoDisplay display;
};

// Private Use Area (BMP - Basic Multilingual Plane)
// Range: U+E000 to U+F8FF
// Number of Characters: 6,400

// https://en.wikipedia.org/wiki/TRS-80_character_set
// U + 1FB00 -> 1FB38 and U + 2588

// I mark trs-80 graphic cells by setting byte 1 to 0xE0.
// There are 64 unique graphic characters including the empty cell,  so 0xE000 -> 0xE03F are used

#define TRS80_GRAPHIC_MARKER 0xE000
#define TRS80_GRAPHIC_MARKER_MASK 0xFF00
#define TRS80_GRAPHIC_CHAR_MASK 0x003F    // would be 0xC0 if we included the graphics marker bit 0x80

/* ionull.c */
twr_ioconsole_t* io_nullcon(void);

/* io.c */
int io_get_prop(twr_ioconsole_t *, const char* key);
void io_putc(twr_ioconsole_t* io, unsigned char c);
void io_putstr(twr_ioconsole_t* io, const char* s);
char io_inkey(twr_ioconsole_t* io);
void io_setfocus(twr_ioconsole_t* io);
int io_chk_brk(twr_ioconsole_t* io);
void io_close(twr_ioconsole_t* io);
void io_printf(twr_ioconsole_t *io, const char *format, ...);
int io_getc32(twr_ioconsole_t* io);
void io_mbgetc(twr_ioconsole_t* io, char* strout);
char *io_mbgets(twr_ioconsole_t* io, char *buffer );
int io_get_cursor(twr_ioconsole_t* io);
void io_set_colors(twr_ioconsole_t* io, unsigned long foreground, unsigned long background);
void io_get_colors(twr_ioconsole_t* io, unsigned long *foreground, unsigned long *background);

void io_cls(twr_ioconsole_t* io);
void io_setc32(twr_ioconsole_t* io, int location, int c);
bool io_setc(twr_ioconsole_t* io, int location, unsigned char c);
void io_setreset(twr_ioconsole_t* io, int x, int y, bool isset);
bool io_point(twr_ioconsole_t* io, int x, int y);
void io_set_cursor(twr_ioconsole_t* io, int loc);
int io_get_width(twr_ioconsole_t* io);
int io_get_height(twr_ioconsole_t* io);
void io_set_cursorxy(twr_ioconsole_t* io, int x, int y);
void io_set_range(twr_ioconsole_t* io, int *chars32, int start, int len);
void io_begin_draw(twr_ioconsole_t* io);
void io_end_draw(twr_ioconsole_t* io);


#ifdef __cplusplus
}
#endif

#endif
