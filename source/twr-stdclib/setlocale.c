#include <locale.h>
#include <stddef.h>
#include <limits.h>
#include <string.h>

// only "C" locale currently supported

locale_t __current_locale;

char* setlocale(int category, const char* locale) {

	if (*locale==0 || (*locale=='C' && locale[1]==0) || stricmp(locale, "POSIX")==0) 
		return "C";
	else
		return NULL;

}

struct lconv *localeconv(void) {

	static struct lconv c = {
		".",  // char* decimal_point;
		"",  // char*thousands_sep;
		"",  // char	*grouping;
		"",  //char	*int_curr_symbol;
		"",  // char	*currency_symbol;
		".", // char	*mon_decimal_point;
		"",  // char	*mon_thousands_sep;
		"",  // char	*mon_grouping;
		"",  //char	*positive_sign;
		"",  // char	*negative_sign;
		UCHAR_MAX, // char	int_frac_digits;
		UCHAR_MAX, // char	frac_digits;
		UCHAR_MAX, //char	p_cs_precedes;
		UCHAR_MAX, //char	p_sep_by_space;
		UCHAR_MAX, // char	n_cs_precedes;
		UCHAR_MAX, // char	n_sep_by_space;
		UCHAR_MAX, //char	p_sign_posn;
		UCHAR_MAX, // char	n_sign_posn;
	};

	return &c;

}

locale_t newlocale(int category_mask, const char *locale, locale_t base) {

	if (*locale==0 || (*locale=='C' && locale[1]==0) || stricmp(locale, "POSIX")==0) 
		return (locale_t)1;
	else
		return (locale_t)0;

}

locale_t	uselocale(locale_t loc) {
	return (locale_t)1;
}

void freelocale(locale_t loc) {
}