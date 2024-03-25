#include <stdarg.h>
#include <stddef.h>
#include <assert.h>
#include <stdlib.h>

#include "twr-crt.h"

// the world's most de-featured printf

static void outstr(twr_cbprintf_callback out, void* cbdata, char *buffer, int size) {
	while (*buffer && size >0) {
		out(cbdata, *buffer);
		buffer++;
		size--;
	}
}

#define valid_flag(flag) (flag=='-' || flag==' ' || flag=='+' || flag=='#' || flag=='0')
#define valid_specifier(sp) (sp=='d' || sp=='x' || sp=='s' || sp=='f' || sp=='g' || sp=='e' || sp=='c')

//%[flags][width][.precision][length]specifier
//valid lengths: h hh l ll j z t L

struct pformat {
	char flag;
	char specifier;
	long width;
	long precision;
	bool flag_minus;
	bool flag_zero;
	bool flag_space;
};

static char* read_format(const char* format, struct pformat* pf) {
	pf->flag=0;
	pf->specifier=0;
	pf->width=0;
	pf->precision=6;
	pf->flag_minus=false;
	pf->flag_zero=false;
	pf->flag_space=false;

	while (1) {
		char c=*format;
		if (!valid_flag(c)) break;
		if (c=='-') pf->flag_minus=true;
		else if (c=='0') pf->flag_zero=true;
		else if (c==' ') pf->flag_space=true;
		format++;
	}
	pf->width=strtol(format, (char**)(&format), 10);
	if (*format=='.') {
		format++;
		pf->precision=strtol(format, (char**)(&format), 10);
	}

	pf->specifier=*format;
	if (valid_specifier(pf->specifier)) {
		format++;
		return (char*)format;
	}
	else {
		pf->specifier=0;
		return (char*)format;
	}
}

static const char zstr[]=  "00000000000000000000";  // 20 zeros
static const char spcstr[]="                    ";  // 20 spaces

void static do_width(const char* in, char* assembly, int size_assembly, bool pad_zeros, int width) {
	const int len=twr_strlen(in);
	int cpylen=width-len;
	if (cpylen<0) cpylen=0;
	nstrcopy(assembly, size_assembly, pad_zeros?zstr:spcstr, sizeof(zstr), cpylen);
	twr_strcat_s(assembly, sizeof(assembly), in);
}

void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list* args) {
	struct pformat pf;

	while (*format) {
		if (*format == '%') {
			format++;
			format=read_format(format, &pf);
			switch (pf.specifier) {
				case 'd':
				{
					char buffer[20];
					char assembly[20];
					twr_itoa_s(va_arg(*args, int), buffer, sizeof(buffer), 10);
					do_width(buffer, assembly, sizeof(assembly), pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));
				}
					break;

				case 'x':
				{
					char buffer[16];
					char assembly[16];
					twr_itoa_s(va_arg(*args, int), buffer, sizeof(buffer), 16);
					do_width(buffer, assembly, sizeof(assembly), pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));

				}
					break;

				case 'g':
				case 'e':
				case 'f':
				{
					char buffer[30];
					double val=va_arg(*args, double);
					if (pf.flag_space && val>=0) out(cbdata, ' ');
					twr_dtoa(buffer, sizeof(buffer), val, pf.precision);
					outstr(out, cbdata, buffer, sizeof(buffer));
				}
					break;

				case 's': 
					outstr(out, cbdata, va_arg(*args, char *), 100000);  // arbitrary max of 100K string length
					break;

				case 'c': 
				{
					const int c=va_arg(*args, int);
					out(cbdata, c);
				}
					break;

				default:  // invalid format, just punt and print it
					out(cbdata, *format);
					format++;
			}
		}
		else { // not a %
			out(cbdata, *format);
			format++;
		}
	}
}

struct snprintf_callback_data {
	int size;
	char* buffer;
	int pos;
};

static void snprintf_callback(void* datain, char ch) {
	struct snprintf_callback_data *data=datain;
	if (data->pos < data->size) {
		data->buffer[data->pos++]=ch;
	}
}

int twr_snprintf(char* buffer, int size, const char* format, ...) {
	va_list args;
	va_start(args, format);

	struct snprintf_callback_data data;
	data.buffer=buffer;
	data.size=size;
	data.pos=0;

	twr_vprintf(snprintf_callback, &data, format, &args);

	if (data.pos<data.size) buffer[data.pos++]=0;

	va_end(args);

	return data.pos;
}

void twr_printf(const char* format, ...) {
	va_list args;
	va_start(args, format);

	twr_vprintf((twr_cbprintf_callback)io_putc, twr_get_stdio_con(), format, &args);

	va_end(args);
}


void twr_dbg_printf(const char* format, ...) {
	va_list args;
	va_start(args, format);

	twr_vprintf((twr_cbprintf_callback)io_putc, twr_get_dbgout_con(), format, &args);
	if (format[twr_strlen(format)-1]!='\n') {
		io_putc(twr_get_dbgout_con(), 0x3);  // ASCII EOT is used to flush the buffer and make sure the line prints to the console.
	}

	va_end(args);
}


int twr_printf_unit_test() {
	char b[100];

	twr_snprintf(b, sizeof(b), "%g", .1);
	if (twr_strcmp(b, "0.1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%x", 1);
	if (twr_strcmp(b, "1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "hello %x %x", 2096, 1037);
	if (twr_strcmp(b, "hello 830 40D")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%02x", 1);
	if (twr_strcmp(b, "01")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%2x", 8);
	if (twr_strcmp(b, " 8")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%3d", 1);
	if (twr_strcmp(b, "  1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%2d", 123);
	if (twr_strcmp(b, "123")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%03d", 1);
	if (twr_strcmp(b, "001")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%c%c%c", 'a','b','c');
	if (twr_strcmp(b, "abc")!=0) return 0;

	return 1;
}


