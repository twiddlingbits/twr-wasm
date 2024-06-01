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
 * The IOConsole can support windows of arbitrary size, as well as
 * un windowed consoles (like RS232 or Line Printer).  For a streaming
 * device like RS232.  
 */

struct IoConsole;

/* type of zero is default TTY (stream) */
#define IO_TYPE_WINDOW (1<<0)

struct IoConsoleHeader {
	int type;
	/* In TTY mode: cursor is the char position on the current line */
	/* In windowed mode: cursor is the cursor position as a count of chars from start of window */
	/* (the position where the next putc is going to go)*/
	int cursor; 
	void (*io_close)  (struct IoConsole*);
	int  (*io_chk_brk)(struct IoConsole*);
};

struct IoCharRead {
	int (*io_getc32)(struct IoConsole *);
	char (*io_inkey)(struct IoConsole*);
};

struct IoCharWrite {
	void (*io_putc)(struct IoConsole*, unsigned char);
};

struct IoConsoleWindow;

typedef unsigned long cellsize_t;

/* Windowed driver functions */
struct IoDisplay {
	int io_width;	// in cells
	int io_height;
	bool cursor_visible;
	cellsize_t* video_mem;
	cellsize_t* back_color_mem;
	cellsize_t* fore_color_mem;

	struct d2d_draw_seq* ds;
	int nest_level;

	void (*io_draw_range)(struct IoConsoleWindow*, int, int);
	void (*io_begin_draw)(struct IoConsoleWindow*);
	void (*io_end_draw)(struct IoConsoleWindow*);

	unsigned long fore_color;
	unsigned long back_color;

	int my_cx;
	int my_cy;

	int my_cell_w1;
	int my_cell_w2;
	int my_cell_h1;
	int my_cell_h2;
	int my_cell_h3;
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
void io_mbgetc_l(struct IoConsole* io, char* strout, locale_t loc);
char *io_gets(struct IoConsole* io, char *buffer );
int io_get_cursor(struct IoConsole* io);
void io_set_colors(struct IoConsole* io, unsigned long foreground, unsigned long background);
void io_get_colors(struct IoConsole* io, unsigned long *foreground, unsigned long *background);

void io_cls(struct IoConsoleWindow* iow);
void io_setc32(struct IoConsoleWindow* iow, int location, int c);
bool io_setc(struct IoConsoleWindow* iow, int location, unsigned char c);
bool io_setreset(struct IoConsoleWindow* iow, int x, int y, bool isset);
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
