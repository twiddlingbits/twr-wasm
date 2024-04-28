#include <stdarg.h>
#include <stddef.h>
#include <assert.h>
#include <stdlib.h>

#include "twr-crt.h"
#include "twr-wasm.h"  //twr_wasm_tofixed


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
	int padlen=width-len;
	if (padlen<0) padlen=0;
	nstrcopy(assembly, size_assembly, pad_zeros?zstr:spcstr, sizeof(zstr), padlen);
	twr_strcat_s(assembly, size_assembly, in);
}

void twr_vprintf(twr_cbprintf_callback out, void* cbdata, const char *format, va_list vlist) {
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
					int assemoff;
					int val=va_arg(vlist, int);
					twr_itoa_s(val, buffer, sizeof(buffer), 10);

					if (val>=0 && pf.flag_space) {
						assembly[0]=' ';
						assemoff=1;
					}
					else {
						assemoff=0;
					}

					do_width(buffer, assembly+assemoff, sizeof(assembly)-assemoff, pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));
				}
					break;

				case 'x':
				{
					char buffer[16];
					char assembly[16];
					twr_itoa_s(va_arg(vlist, int), buffer, sizeof(buffer), 16);
					do_width(buffer, assembly, sizeof(assembly), pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));

				}
					break;

				case 'f':
				{
					char buffer[30];
					char assembly[30];
					int assemoff;
					double val=va_arg(vlist, double);
					twr_wasm_tofixed(buffer, sizeof(buffer), val, pf.precision);
					
					if (val>=0 && pf.flag_space) {
						assembly[0]=' ';
						assemoff=1;
					}
					else {
						assemoff=0;
					}

					do_width(buffer, assembly+assemoff, sizeof(assembly)-assemoff, pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));
				}
					break;

				case 'e':
				{
					char buffer[30];
					char assembly[30];
					int assemoff;
					double val=va_arg(vlist, double);
					twr_wasm_toexponential(buffer, sizeof(buffer), val, pf.precision);
					
					if (val>=0 && pf.flag_space) {
						assembly[0]=' ';
						assemoff=1;
					}
					else {
						assemoff=0;
					}

					do_width(buffer, assembly+assemoff, sizeof(assembly)-assemoff, pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));
				}
					break;

				case 'g':
				{
					char buffer[30];
					char assembly[30];
					double val=va_arg(vlist, double);
					int assemoff;
					twr_dtoa(buffer, sizeof(buffer), val, pf.precision);
					if (val>=0 && pf.flag_space) {
						assembly[0]=' ';
						assemoff=1;
					}
					else {
						assemoff=0;
					}
					do_width(buffer, assembly+assemoff, sizeof(assembly)-assemoff, pf.flag_zero, pf.width);
					outstr(out, cbdata, assembly, sizeof(assembly));
				}
					break;

				case 's': 
					outstr(out, cbdata, va_arg(vlist, char *), 100000);  // arbitrary max of 100K string length
					break;

				case 'c': 
				{
					const int c=va_arg(vlist, int);
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
	char *const buffer;
	const twr_size_t size;
	twr_size_t pos;
};

static void snprintf_callback(void* datain, char ch) {
	struct snprintf_callback_data *data=datain;
	if (data->pos < data->size) {
		data->buffer[data->pos++]=ch;
	}
}

int twr_snprintf(char *buffer, twr_size_t bufsz, const char *format, ... ) {
	va_list vlist;
	va_start(vlist, format);

	const int rv=twr_vsnprintf(buffer, bufsz, format, vlist);

	va_end(vlist);

	return rv;
}

int twr_vsnprintf(char *buffer, twr_size_t bufsz, const char *format, va_list vlist) {
	struct snprintf_callback_data data = {.buffer=buffer, .size=bufsz, .pos=0};

	twr_vprintf(snprintf_callback, &data, format, vlist);

	if (data.pos<data.size) buffer[data.pos++]=0;

	return data.pos;
}


void twr_printf(const char* format, ...) {
	va_list args;
	va_start(args, format);

	twr_vprintf((twr_cbprintf_callback)io_putc, twr_get_stdio_con(), format, args);

	va_end(args);
}


void twr_conlog(const char* format, ...) {
	va_list args;
	va_start(args, format);

	twr_vprintf((twr_cbprintf_callback)io_putc, twr_get_dbgout_con(), format, args);
	io_putc(twr_get_dbgout_con(), 0x3);  // ASCII EOT is used to flush the buffer and make sure the line prints to the console.

	va_end(args);
}

void twr_fprintf(FILE *stream, const char* format, ...) {
	va_list vlist;
	va_start(vlist, format);

	twr_vprintf((twr_cbprintf_callback)io_putc, stream, format, vlist);

	va_end(vlist);
}

// should reurns The number of characters written if successful or negative value if an error occurred.
void  twr_vfprintf( FILE *stream, const char *format, va_list vlist ) {
	twr_vprintf((twr_cbprintf_callback)io_putc, stream, format, vlist);
}


int twr_printf_unit_test() {
	char b[100];

	// g

	twr_snprintf(b, sizeof(b), "%g", .1);
	//twr_conlog("'%s'", b);
	if (twr_strcmp(b, "0.1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "% g", .1);
	if (twr_strcmp(b, " 0.1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%.15g", 1000.5);
	if (twr_strcmp(b, "1000.5")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%.15g", 1000+1.0/3.0);
	if (twr_strcmp(b, "1000.33333333333")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%g",100000.5 );
	if (twr_strcmp(b, "100001")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%g", 10000000.5 );
	if (twr_strcmp(b, "1.00000e+7")!=0) return 0;    // GCC give 1e+07

	twr_snprintf(b, sizeof(b), "%g", -1.5);
	if (twr_strcmp(b, "-1.5")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%.1g", 125.0);
	if (twr_strcmp(b, "1e+2")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%6.1g", 125.1);
	if (twr_strcmp(b, "  1e+2")!=0) return 0;

// f

	twr_snprintf(b, sizeof(b), "%f", .5);
	if (twr_strcmp(b, "0.500000")!=0) return 0;

	twr_snprintf(b, sizeof(b), "% f", .5);
	if (twr_strcmp(b, " 0.500000")!=0) return 0;

	twr_snprintf(b, sizeof(b), "% f", -.5);
	if (twr_strcmp(b, "-0.500000")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%6.2f", -.5);
	if (twr_strcmp(b, " -0.50")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%f", 123.45678);
	if (twr_strcmp(b, "123.456780")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%f", -123.45678);
	if (twr_strcmp(b, "-123.456780")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%8.2f", 123.45678);
	if (twr_strcmp(b, "  123.46")!=0) return 0;
	 
// e

	twr_snprintf(b, sizeof(b), "%e", 123.45678);
	if (twr_strcmp(b, "1.234568e+2")!=0) return 0;  // NOTE gcc printf gives 1.234568e+02

	twr_snprintf(b, sizeof(b), "%e", -123.45678);
	if (twr_strcmp(b, "-1.234568e+2")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%8.2e", 123.45678);
	if (twr_strcmp(b, " 1.23e+2")!=0) return 0;  // gcc gives  '1.23e+02'

	twr_snprintf(b, sizeof(b), "% e", .5);
	if (twr_strcmp(b, " 5.000000e-1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%e", -.5);
	if (twr_strcmp(b, "-5.000000e-1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%6.2e", -.5);
	if (twr_strcmp(b, "-5.00e-1")!=0) return 0;

// x

	twr_snprintf(b, sizeof(b), "%x", 1);
	if (twr_strcmp(b, "1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "hello %x %x", 2096, 1037);
	if (twr_strcmp(b, "hello 830 40D")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%02x", 1);
	if (twr_strcmp(b, "01")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%2x", 8);
	if (twr_strcmp(b, " 8")!=0) return 0;

// d

	twr_snprintf(b, sizeof(b), "%d", 1);
	if (twr_strcmp(b, "1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%d", 12345678);
	if (twr_strcmp(b, "12345678")!=0) return 0;	

	twr_snprintf(b, sizeof(b), "% d", 1);
	if (twr_strcmp(b, " 1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "% d", -1);
	if (twr_strcmp(b, "-1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%3d", 1);
	if (twr_strcmp(b, "  1")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%2d", 123);
	if (twr_strcmp(b, "123")!=0) return 0;

	twr_snprintf(b, sizeof(b), "%03d", 1);
	if (twr_strcmp(b, "001")!=0) return 0;

	//twr_snprintf(b, sizeof(b), "%6.2d", -5);   // NOT IMPLEMENTED YET
	//twr_conlog("'%s'",b);
	//if (twr_strcmp(b, "   -05")!=0) return 0;
	

// c

	twr_snprintf(b, sizeof(b), "%c%c%c", 'a','b','c');
	if (twr_strcmp(b, "abc")!=0) return 0;

	return 1;
}


