#ifndef __TWR_IO_H__
#define __TWR_IO_H__

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
	int (*io_getc)(struct IoConsole *);
	char (*io_inkey)(struct IoConsole*);
};

struct IoCharWrite {
	void (*io_putc)(struct IoConsole*, char);
};

struct IoConsoleWindow;

/* Windowed driver functions */
struct IoDisplay {
	unsigned short io_width;	// in cells
	unsigned short io_height;
	int cursor_visible;
	unsigned char* video_mem;

	void (*io_draw_range)(struct IoConsoleWindow*, unsigned char*, int, int);
	unsigned char (*io_peek_keyboard)(struct IoConsoleWindow*, unsigned short);

	int lower_case_mod_installed;
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

/* ionull.c */
struct IoConsole* twr_get_nullcon();

/* io.c */
void io_putc(struct IoConsole* io, char c);
void io_putstr(struct IoConsole* io, const char* s);
char io_inkey(struct IoConsole* io);
int io_chk_brk(struct IoConsole* io);
void io_close(struct IoConsole* io);
void io_printusingnum(struct IoConsole *io, char* string, double value);
void io_printf(struct IoConsole *io, const char *format, ...);
int io_getc(struct IoConsole* io);
char *io_gets(struct IoConsole* io, char *buffer );
int io_get_cursor(struct IoConsole* io);

void io_cls(struct IoConsoleWindow* iow);
void io_set_c(struct IoConsoleWindow* iow, int loc, unsigned char c);
unsigned char io_peek(struct IoConsoleWindow* iow, short loc);
bool io_setreset(struct IoConsoleWindow* iow, short x, short y, bool isset);
short io_point(struct IoConsoleWindow* iow, short x, short y);
void io_set_cursor(struct IoConsoleWindow* iow, int loc);
void io_set_cursorxy(struct IoConsoleWindow* iow, int x, int y);
void io_draw_range(struct IoConsoleWindow* iow, int x, int y);

#ifdef __cplusplus
}
#endif

#endif
