#include <ctype.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "twr-crt.h"
#include "twr-jsimports.h"

// does not use locale information; it always uses . (a dot) as the decimal separator.
// twr_localize_numeric_string() is available to convert buffer if needed
void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision) {
    twrDtoa(buffer, buffer_size, value, max_precision);
}

// does not use locale information; it always uses . (a dot) as the decimal separator.
void twr_tofixed(char* buffer, int buffer_size, double value, int dec_digits) {
    twrToFixed(buffer, buffer_size, value, dec_digits);
}

// does not use locale information; it always uses . (a dot) as the decimal separator.
void twr_toexponential(char* buffer, int buffer_size, double value, int dec_digits) {
    twrToExponential(buffer, buffer_size, value, dec_digits);
}

//The fcvt_s() function in C does not use locale information; it always uses . (a dot) as the decimal separator.
int _fcvt_s(
   char* buffer,
   unsigned long sizeInBytes, //size_t
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
) {
    return twrFcvtS(buffer, sizeInBytes, value, fracpart_numdigits, dec, sign);
}

/****************************************************************/
/****************************************************************/
/****************************************************************/

// [whitespace] [sign] [digits] [.digits] [ {e | E }[sign]digits]
// also allow (fortran style) d/D instead of e/E
// use locale-specific decimal separators. 
static void parse_ascfloat(char **str, char ** str_end, int *sign, bool *isInf, bool *isNan, char* decimal, locale_t locale) {
	int len;

	*decimal=__get_lconv_lc_numeric(locale)->decimal_point[0];

	/** ignore leading space */
	while (isspace_l(**str, locale)) (*str)++;
	*sign=__atosign(*str, &len);
	*isInf=false;
	*isNan=false;
	if (0==strnicmp(*str, "INFINITE", 8)) {
		*isInf=true;
		*str_end=*str+len+8;
		return;
	}
	else if (0==strnicmp(*str, "INF", 3)) {
		*isInf=true;
		*str_end=*str+len+3;
		return;
	}
	else if (0==strnicmp(*str, "NAN", 3)) {
		*isNan=true;
		*str_end=*str+len+3;
		return;
	}

	*str_end=*str+len;
	while (isdigit(**str_end)) (*str_end)++;
	if (**str_end==*decimal) {
		(*str_end)++;
		while (isdigit(**str_end)) (*str_end)++;
	}
	if (**str_end=='e' || **str_end=='E' || **str_end=='d' || **str_end=='D') {
		(*str_end)++;
		if (**str_end=='+' || **str_end=='-') (*str_end)++;
		while (isdigit(**str_end)) (*str_end)++;
	}

	return;
}

double strtod_l(const char *str, char **str_end, locale_t locale) {
	const char *p=str;
	bool isinf, isnan;
	int sign;
	char decimal;
	char *dummy;
	char **end;

	if (str_end==NULL) 
		end=&dummy;
	else
		end=str_end;

	parse_ascfloat((char**)&p, end, &sign, &isinf, &isnan, &decimal, locale);

	const int len=*end-p;
	if (decimal=='.') {
   	return twrAtod(p, len);
	}
	else {
		char tmp[len];
		memcpy(tmp, p, len);
		char* dp=memchr(tmp, decimal, len);
		if (dp) *dp='.';
   	return twrAtod(tmp, len);
	}
}

// strtod() does use locale-specific decimal separators. 
// its behavior regarding the decimal point depends on the current locale settings.
double strtod(const char *str, char **str_end) {
	return strtod_l(str, str_end, twr_get_current_locale());
}

//the atof() function does not use locale-specific decimal separators. 
//Instead, it always expects the decimal point to be a period (.)
double atof(const char* str) {
	return strtod_l(str, (char **)NULL, __get_static_locale_c());
}

float strtof_l(const char *str, char ** str_end, locale_t locale) {
	return (float)strtod_l(str, str_end, locale);

}

float strtof(const char *str, char ** str_end) {
	return strtof_l(str, str_end, twr_get_current_locale());
}

// not yet implemented - strait forward to implement with the code in the float folder
// this place holder to get libcxx to build
long double strtold_l(const char *str, char **str_end, locale_t locale) {
	return (long double)strtod_l(str, str_end, locale);
}

long double strtold( const char *str, char **str_end ) {
	return strtold_l(str, str_end, twr_get_current_locale());
}

/**************************************************/

// should replace with these stdclib defines in math.h
//#define NAN __builtin_nanf("")
//#define INFINITY __builtin_inf()

double twr_nanval() {
	return __builtin_nan("");
}

double twr_infval() {
	return __builtin_inf();
}

/**************************************************/
int cvtfloat_unit_test() {
	bool isinf, isnan;
	int sign;
	char* end;
	char dec;

	char *x="1";
	parse_ascfloat(&x, &end, &sign, &isinf, &isnan, &dec, twr_get_current_locale());
	if (end!=x+1 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x="-1";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec, twr_get_current_locale());
	if (end!=x+2 || sign!=-1 || isinf!=false || isnan!=false) return 0;

	x="1.1";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec, twr_get_current_locale());
	if (end!=x+3 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x=" +123";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec, twr_get_current_locale());
	if (*x!='+' || end!=x+4 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x="-1.1e+3";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec, twr_get_current_locale());
	if (end!=x+7 || sign!=-1 || isinf!=false || isnan!=false) return 0;

	x="1.1D4";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec, twr_get_current_locale());
	if (end!=x+5 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x="1.1D-4";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec,  twr_get_current_locale());
	if (end!=x+6 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x="1d1";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec,  twr_get_current_locale());
	if (end!=x+3 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x="1fd1";
	parse_ascfloat(&x,&end, &sign, &isinf, &isnan, &dec,  twr_get_current_locale());
	if (end!=x+1 || sign!=1 || isinf!=false || isnan!=false) return 0;

	x="1d1";
	if (10.0 != strtod(x,&end)) return 0;
	if (end!=x+3) return 0;

	x="1d1";
	if (10.0 != strtod(x,&end)) return 0;
	if (end!=x+3) return 0;

	x = "111.11 -2.22 Nan inF 1.18973e+33zzz";
   if (strtod(x, &end)!=111.11) return 0;
	x = end;
   if (strtod(x, &end)!=-2.22) return 0;
	x = end;
   double r=strtod(x, &end);
	if (!isnan(r)) return 0;
	x = end;
   r=strtod(x, &end);
	if (!isinf(r)) return 0;
	x = end;
   if (strtod(x, &end)!=1.18973e+33) return 0;

	const char *lstr=setlocale(LC_ALL, "");
	if (strncmp(lstr,"fr",2)==0) {
		x="100,12";
		r=strtod(x,&end);
		if (100.12 != r) return 0;
		if (end!=x+6) return 0;
	}


	return 1;
}
