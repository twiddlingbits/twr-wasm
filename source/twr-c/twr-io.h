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
   void (*io_close)  (struct IoConsole*);
   int  (*io_chk_brk)(struct IoConsole*);
   int (*io_get_prop)(struct IoConsole *, const char* key);
};

struct IoCharRead {
   int (*io_getc32)(struct IoConsole *);
   char (*io_inkey)(struct IoConsole*);
};

struct IoCharWrite {
   void (*io_putc)(struct IoConsole*, unsigned char);
   void (*io_putstr)(struct IoConsole*, const char *);
};

struct IoDisplay {
   int width, height;
   void (*io_cls)(struct IoConsoleWindow *);
   void (*io_setc32)(struct IoConsoleWindow *, int location, int c32);
   void (*io_setreset)(struct IoConsoleWindow *, int x, int y, bool isset);
   bool (*io_point)(struct IoConsoleWindow *, int x, int y);
   void (*io_set_cursor)(struct IoConsoleWindow *, int position);
   void (*io_set_colors)(struct IoConsoleWindow *, unsigned long foreground, unsigned long background);
   void (*io_set_range)(struct IoConsoleWindow *, int *chars32, int start, int len);
};

struct IoConsole {
   struct IoConsoleHeader header;  	
   struct IoCharRead charin;  			
   struct IoCharWrite charout;	
};

struct IoConsoleWindow {
   struct IoConsole con;
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
struct IoConsole* io_nullcon(void);

/* io.c */
void io_putc(struct IoConsole* io, unsigned char c);
void io_putstr(struct IoConsole* io, const char* s);
char io_inkey(struct IoConsole* io);
int io_chk_brk(struct IoConsole* io);
void io_close(struct IoConsole* io);
void io_printf(struct IoConsole *io, const char *format, ...);
int io_getc32(struct IoConsole* io);
void io_mbgetc(struct IoConsole* io, char* strout);
char *io_mbgets(struct IoConsole* io, char *buffer );
int io_get_cursor(struct IoConsole* io);
void io_set_colors(struct IoConsole* io, unsigned long foreground, unsigned long background);
void io_get_colors(struct IoConsole* io, unsigned long *foreground, unsigned long *background);

void io_cls(struct IoConsoleWindow* iow);
void io_setc32(struct IoConsoleWindow* iow, int location, int c);
bool io_setc(struct IoConsoleWindow* iow, int location, unsigned char c);
void io_setreset(struct IoConsoleWindow* iow, int x, int y, bool isset);
bool io_point(struct IoConsoleWindow* iow, int x, int y);
void io_set_cursor(struct IoConsoleWindow* iow, int loc);
void io_set_cursorxy(struct IoConsoleWindow* iow, int x, int y);
void io_draw_range(struct IoConsoleWindow* iow, int x, int y);
void io_begin_draw(struct IoConsole* io);
void io_end_draw(struct IoConsole* io);

#ifdef __cplusplus
}
#endif

#endif
