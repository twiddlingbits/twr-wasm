#include <stdarg.h>
#include <stddef.h>
#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#include "twr-crt.h"


// de-featured printf

static void outstr(twr_vcbprintf_callback out, void* cbdata, char *buffer, int size) {
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

static char* read_format(const char* format, struct pformat* pf, va_list * vlist) {
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
	if (*format=='*') {
		pf->width=va_arg(*vlist, int);
		format++;
	}
	else {
		pf->width=strtol(format, (char**)(&format), 10);
	}
	if (*format=='.') {
		format++;
		if (*format=='*') {
			pf->precision=va_arg(*vlist, int);
			format++;
		}
		else {
			pf->precision=strtol(format, (char**)(&format), 10);
		}
	}

	//the only length modifier currently supported is 'l', and its ignored since its generally the default
	if (*format=='l') {
		format++;
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
	const int len=strlen(in);
	int padlen=width-len;
	if (padlen<0) padlen=0;
	nstrcopy(assembly, size_assembly, pad_zeros?zstr:spcstr, sizeof(zstr), padlen);
	strcat_s(assembly, size_assembly, in);
}

void twr_vcbprintf(twr_vcbprintf_callback out, void* cbdata, const char *format, va_list vlist) {
	struct pformat pf;

	while (*format) {
		if (*format == '%') {
			format++;
			format=read_format(format, &pf, &vlist);
			switch (pf.specifier) {
				case 'd':
				{
					char buffer[20];
					char assembly[20];
					int assemoff;
					int val=va_arg(vlist, int);
					_itoa_s(val, buffer, sizeof(buffer), 10);

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
					_itoa_s(va_arg(vlist, int), buffer, sizeof(buffer), 16);
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
					twr_tofixed(buffer, sizeof(buffer), val, pf.precision);
					
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
					twr_toexponential(buffer, sizeof(buffer), val, pf.precision);
					
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

/*************/

struct snprintf_callback_data {
	char *const buffer;
	const size_t bufsz;
	size_t pos;
};

static void snprintf_callback(void* datain, unsigned char ch) {
	struct snprintf_callback_data *const data=datain;
	if (data->pos+1 < data->bufsz) {  // leave room for terminating zero
		data->buffer[data->pos]=(char)ch;
	}
	data->pos++;
}

// if bufsz==0 the number of character that would have been written is counted, but nothing is written to buffer
// the return value does not depend on the actual buffer size provided (bufsz), but on what the result would be with an infinite buffer.
int vsnprintf(char *buffer, size_t bufsz, const char *format, va_list vlist) {
	assert(bufsz==0 || buffer);
	struct snprintf_callback_data data = {.buffer=buffer, .bufsz=bufsz, .pos=0};
	twr_vcbprintf(snprintf_callback, &data, format, vlist);
	if (buffer && data.bufsz) buffer[__min(data.pos, bufsz-1)]=0; 
	return data.pos;
}


int snprintf(char *buffer, size_t bufsz, const char *format, ... ) {
	va_list vlist;
	va_start(vlist, format);

	const int rv=vsnprintf(buffer, bufsz, format, vlist);

	va_end(vlist);

	return rv;
}

int sprintf( char *buffer, const char *format, ... ) {
	va_list vlist;
	va_start(vlist, format);

	const int rv=vsnprintf(buffer, SIZE_MAX, format, vlist);

	va_end(vlist);

	return rv;
}


/*************/

int vasprintf(char **strp, const char* format, va_list vlist ) {

	va_list args2;
   va_copy(args2, vlist);

	int k=vsnprintf(NULL, 0, format, vlist);

	void* buffer=malloc(k+1);
	vsnprintf(buffer, k+1, format, args2);
   va_end(args2);

	return k;
}

/*************/

struct putc_cbdata {
	int count;
	FILE* stream;
};

static void putc_callback(void* datain, unsigned char ch) {
	struct putc_cbdata *d=datain;
	d->count++;
	io_putc(d->stream, ch);
}

int vprintf(const char* format, va_list vlist ) {
	struct putc_cbdata ud = {.stream=stdout, .count=0};
	twr_vcbprintf(putc_callback, &ud, format, vlist);
	return ud.count;
}

int printf(const char* format, ...) {
	va_list vlist;
	va_start(vlist, format);

	int rv=vprintf(format, vlist);

	va_end(vlist);

	return rv;
}

/*************/

void twr_conlog(const char* format, ...) {
	va_list vlist;
	va_start(vlist, format);

	twr_vcbprintf((twr_vcbprintf_callback)io_putc, stderr, format, vlist);
	io_putc(twr_get_dbgout_con(), 0x3);  // ASCII EOT is used to flush the buffer and make sure the line prints to the console.

	va_end(vlist);
}

/*************/

// reurns the number of characters written if successful or negative value if an error occurred.
int vfprintf( FILE *stream, const char *format, va_list vlist ) {
	struct putc_cbdata ud = {.stream=stream, .count=0};

	twr_vcbprintf(putc_callback, &ud, format, vlist);
	return ud.count;
}

int fprintf(FILE *stream, const char* format, ...) {
	va_list vlist;
	va_start(vlist, format);

	int rv=vfprintf(stream, format, vlist);

	va_end(vlist);

	return rv;
}

size_t fwrite( const void* buffer, size_t size, size_t count, FILE* stream ) {
	size_t k=size*count;
	const unsigned char *p=buffer;

	while (k--) {
		io_putc(stream, *p++);
	}

	return count;
}

int ferror(FILE *stream) {
	return 0;
}

int feof(FILE *stream) {
	return 0;
}

int fflush(FILE *stream) {
	return 0;
}

int is_terminal(FILE *stream) {
	return 1;
}

int putc(int ch, FILE* stream) {
	io_putc(stream, (unsigned char)ch);
	return ch;
}

int fputc( int ch, FILE* stream ) {
	return putc(ch, stream);
}

int getc(FILE *stream ) {
	return io_getc(stream);
}

int fgetc( FILE *stream ) {
	return getc(stream);
}

// these three functions are not yet implemented
// here to get libcxx to compile
int vsscanf(const char *buffer, const char *format, va_list arglist) {
	twr_conlog("vsscanf is not currently implemented.");
	assert(false);
	return EOF;
}

int sscanf( const char *buffer, const char *format, ... ) {
	twr_conlog("sscanf is not currently implemented.");
	assert(false);
	return EOF;
}

int ungetc( int ch, FILE *stream ) {
	twr_conlog("ungetc is not currently implemented.");
	assert(false);
	return EOF;
}


/*************/

// this function is used by clang printf builtin
int puts(const char *str) {
	io_putstr(stdout, str);
	io_putc(stdout,'\n');
	return 1;
}

// this function is used by clang printf builtin
int putchar(int c) {
	io_putc(stdout, (char)c);
	return c;
}

/*************/


int printf_unit_test() {
	char b[100];
	int k;

	// g

	snprintf(b, sizeof(b), "%g", .1);
	//twr_conlog("'%s'", b);
	if (strcmp(b, "0.1")!=0) return 0;

	snprintf(b, sizeof(b), "% g", .1);
	if (strcmp(b, " 0.1")!=0) return 0;

	snprintf(b, sizeof(b), "%.15g", 1000.5);
	if (strcmp(b, "1000.5")!=0) return 0;

	snprintf(b, sizeof(b), "%.15g", 1000+1.0/3.0);
	if (strcmp(b, "1000.33333333333")!=0) return 0;

	snprintf(b, sizeof(b), "%g",100000.5 );
	if (strcmp(b, "100001")!=0) return 0;

	snprintf(b, sizeof(b), "%g", 10000000.5 );
	if (strcmp(b, "1.00000e+7")!=0) return 0;    // GCC give 1e+07

	snprintf(b, sizeof(b), "%g", -1.5);
	if (strcmp(b, "-1.5")!=0) return 0;

	snprintf(b, sizeof(b), "%.1g", 125.0);
	if (strcmp(b, "1e+2")!=0) return 0;

	snprintf(b, sizeof(b), "%6.1g", 125.1);
	if (strcmp(b, "  1e+2")!=0) return 0;

// f

	snprintf(b, sizeof(b), "%f", .5);
	if (strcmp(b, "0.500000")!=0) return 0;

	snprintf(b, sizeof(b), "% f", .5);
	if (strcmp(b, " 0.500000")!=0) return 0;

	snprintf(b, sizeof(b), "% f", -.5);
	if (strcmp(b, "-0.500000")!=0) return 0;

	snprintf(b, sizeof(b), "%6.2f", -.5);
	if (strcmp(b, " -0.50")!=0) return 0;

	snprintf(b, sizeof(b), "%f", 123.45678);
	if (strcmp(b, "123.456780")!=0) return 0;

	snprintf(b, sizeof(b), "%f", -123.45678);
	if (strcmp(b, "-123.456780")!=0) return 0;

	snprintf(b, sizeof(b), "%8.2f", 123.45678);
	if (strcmp(b, "  123.46")!=0) return 0;
	 
// e

	snprintf(b, sizeof(b), "%e", 123.45678);
	if (strcmp(b, "1.234568e+2")!=0) return 0;  // NOTE gcc printf gives 1.234568e+02

	snprintf(b, sizeof(b), "%e", -123.45678);
	if (strcmp(b, "-1.234568e+2")!=0) return 0;

	snprintf(b, sizeof(b), "%8.2e", 123.45678);
	if (strcmp(b, " 1.23e+2")!=0) return 0;  // gcc gives  '1.23e+02'

	snprintf(b, sizeof(b), "% e", .5);
	if (strcmp(b, " 5.000000e-1")!=0) return 0;

	snprintf(b, sizeof(b), "%e", -.5);
	if (strcmp(b, "-5.000000e-1")!=0) return 0;

	snprintf(b, sizeof(b), "%6.2e", -.5);
	if (strcmp(b, "-5.00e-1")!=0) return 0;

// x

	snprintf(b, sizeof(b), "%x", 1);
	if (strcmp(b, "1")!=0) return 0;

	snprintf(b, sizeof(b), "hello %x %x", 2096, 1037);
	if (strcmp(b, "hello 830 40D")!=0) return 0;

	snprintf(b, sizeof(b), "%02x", 1);
	if (strcmp(b, "01")!=0) return 0;

	snprintf(b, sizeof(b), "%2x", 8);
	if (strcmp(b, " 8")!=0) return 0;

// d

	snprintf(b, sizeof(b), "%d", 1);
	if (strcmp(b, "1")!=0) return 0;

	snprintf(b, sizeof(b), "%d", 12345678);
	if (strcmp(b, "12345678")!=0) return 0;	

	snprintf(b, sizeof(b), "% d", 1);
	if (strcmp(b, " 1")!=0) return 0;

	snprintf(b, sizeof(b), "% d", -1);
	if (strcmp(b, "-1")!=0) return 0;

	snprintf(b, sizeof(b), "%3d", 1);
	if (strcmp(b, "  1")!=0) return 0;

	snprintf(b, sizeof(b), "%2d", 123);
	if (strcmp(b, "123")!=0) return 0;

	snprintf(b, sizeof(b), "%03d", 1);
	if (strcmp(b, "001")!=0) return 0;

	//snprintf(b, sizeof(b), "%6.2d", -5);   // NOT IMPLEMENTED YET
	//twr_conlog("'%s'",b);
	//if (strcmp(b, "   -05")!=0) return 0;
	

// c

	snprintf(b, sizeof(b), "%c%c%c", 'a','b','c');
	if (strcmp(b, "abc")!=0) return 0;

// lengths

	k=snprintf(NULL, 0, "123");
	if (k!=3) return 0;

	b[0]='x';
	b[1]='y';
	b[2]='z';
	b[3]='Z';
	b[4]='X';
	k=snprintf(b, 0, "%d",1);
	if (k!=1) return 0;
	if (b[0]!='x' || b[1]!='y' || b[2]!='z' || b[3]!='Z' || b[4]!='X') return 0;

	k=snprintf(b, 4, "123456789");
	if (k!=9) return 0;
	if (strlen(b)!=3) return 0;
	if (strcmp(b, "123")!=0) return 0;

	k=snprintf(b, 1, "123456789");
	if (k!=9) return 0;
	if (strlen(b)!=0) return 0;
	if (strcmp(b, "")!=0) return 0;

// * width
	sprintf(b, "%*d", (int)3, 99);
	if (strcmp(b, " 99")!=0) return 0;

// * precision
	sprintf(b, "%.*g", 5, 123.45678);
	if (strcmp(b, "123.46")!=0) return 0;

// length 'l'
	sprintf(b, "%ld", (long)99);
	if (strcmp(b, "99")!=0) return 0;

//sprintf test case that used to fail
	strcpy(b,"123456789");
	sprintf(b, "%02d",4);
	if (strcmp(b, "04")!=0) return 0;

// UTF-8 Support
	strcpy(b, "\u20AC1.23");
	printf("%s\n", b);  // €1.23

	return 1;
}


