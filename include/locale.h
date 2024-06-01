#ifndef __TWR_LOCALE_H__
#define __TWR_LOCALE_H__

#include <_stdtypes.h>  // for NULL, locale_t
#include <stdbool.h>
#include <stdio.h> // EOF

#define	LC_ALL		0
#define	LC_COLLATE	1
#define	LC_CTYPE		2
#define	LC_MONETARY	3
#define	LC_NUMERIC	4
#define	LC_TIME		5
#define  LC_MESSAGES	6

#define	_LC_LAST	7		/* marks end */

#define	LC_COLLATE_MASK	(1 << LC_COLLATE)
#define	LC_CTYPE_MASK		(1 << LC_CTYPE)
#define	LC_MONETARY_MASK	(1 << LC_MONETARY)
#define	LC_NUMERIC_MASK	(1 << LC_NUMERIC)
#define	LC_TIME_MASK		(1 << LC_TIME)
#define	LC_MESSAGES_MASK	(1 << LC_MESSAGES)

#define	LC_ALL_MASK		( LC_COLLATE_MASK | LC_CTYPE_MASK | LC_MONETARY_MASK | LC_NUMERIC_MASK | LC_TIME_MASK | LC_MESSAGES_MASK)


#ifdef __cplusplus
extern "C" {
#endif

#define LC_GLOBAL_LOCALE twr_get_current_locale()

struct lconv {
	char	*decimal_point;
	char	*thousands_sep;
	char	*grouping;
	char	*int_curr_symbol;
	char	*currency_symbol;
	char	*mon_decimal_point;
	char	*mon_thousands_sep;
	char	*mon_grouping;
	char	*positive_sign;
	char	*negative_sign;
	char	int_frac_digits;
	char	frac_digits;
	char	p_cs_precedes;
	char	p_sep_by_space;
	char	n_cs_precedes;
	char	n_sep_by_space;
	char	p_sign_posn;
	char	n_sign_posn;
	char int_p_cs_precedes;
	char int_p_sep_by_space;
	char int_n_cs_precedes;
	char int_n_sep_by_space;
	char int_p_sign_posn;
	char int_n_sign_posn;
};

struct __locale_t_struct {
	struct lconv * lc_all;
	struct lconv * lc_collate;
	struct lconv * lc_ctype;
	struct lconv * lc_monetary;
	struct lconv * lc_numeric;
	struct lconv * lc_time;
	struct lconv * lc_message;
};

char* setlocale(int category, const char* locale);
struct lconv *localeconv(void);

locale_t newlocale(int category_mask, const char *locale, locale_t base);
locale_t	uselocale(locale_t);
void freelocale(locale_t);
locale_t duplocale(locale_t);

extern inline bool __is_c_locale(const struct lconv * lcp);
extern inline bool  __is_utf8_locale(const struct lconv * lcp);
extern inline bool  __is_1252_locale(const struct lconv * lcp);
extern inline locale_t __get_static_locale_c(void);
extern inline struct lconv * __get_lconv_lc_ctype(locale_t loc);
extern inline struct lconv * __get_lconv_lc_numeric(locale_t loc);
extern inline struct lconv * __get_lconv_lc_monetary(locale_t loc);
extern inline struct lconv * __get_lconv_lc_collate(locale_t loc);
extern inline struct lconv * __get_lconv_lc_time(locale_t loc);

int __get_code_page(const struct lconv * lcp);
int __get_current_lc_ctype_code_page(void);
int __get_current_lc_time_code_page(void);
int __get_current_lc_ctype_code_page_modified(void);

void twr_localize_numeric_string(char* str, locale_t locale);
extern inline locale_t twr_get_current_locale(void);
void twr_utf32_to_code_page(char*out, int utf32);
int twr_code_page_to_utf32_streamed(unsigned char byte);

// values returned by __get_code_page()
#define TWR_CODEPAGE_ASCII 0
#define TWR_CODEPAGE_1252 1252
#define TWR_CODEPAGE_UTF8 65001  //we are using Microsoft style -- there is no standard


struct locale_dtnames {
	char* day[7];
	char* abday[7];
	char* month[12];
	char* abmonth[12];
	char* ampm[2];
};

struct locale_dtnames* __get_dtnames(locale_t loc);

#ifdef __cplusplus
}
#endif

#endif // __TWR_LOCALE_H__
