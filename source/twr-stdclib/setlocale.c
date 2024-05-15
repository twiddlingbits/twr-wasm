#include <locale.h>
#include <stddef.h>
#include <limits.h>
#include <string.h>
#include <errno.h>
#include <stdlib.h>
#include <assert.h>
#include <twr-jsimports.h>
#include <stdio.h>

// "C" and "" locale supported

locale_t __current_locale;

static struct lconv lconv_C = {
	".",  // char* decimal_point;
	"",  // char *thousands_sep;
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
	UCHAR_MAX, // char n_cs_precedes;
	UCHAR_MAX, // char n_sep_by_space;
	UCHAR_MAX, //char	p_sign_posn;
	UCHAR_MAX, // char n_sign_posn;
	UCHAR_MAX, // int_p_cs_precedes
	UCHAR_MAX, // int_p_sep_by_space
	UCHAR_MAX, // int_n_cs_precedes
	UCHAR_MAX, // int_n_sep_by_space
	UCHAR_MAX, // int_p_sign_posn
	UCHAR_MAX  // int_n_sign_posn
};

static struct lconv *plconv_user;

static char* user_language;

static void create_lconv_user(void) {
	assert(plconv_user==NULL);
	plconv_user=malloc(sizeof(struct lconv));
	memcpy(plconv_user, &lconv_C, sizeof(struct lconv));
	twrUserLconv(plconv_user);
	if (user_language==NULL) user_language=twrUserLanguage();
	//printf ("thousands: %s\n", plconv_user->thousands_sep);
}

static void setup_current_locale_if_needed(void) {
	if (__current_locale==0)
		__current_locale=newlocale(LC_ALL_MASK, "C", (locale_t)0);
}

// chatgpt 4 says:
//Numeric Fields
//decimal_point: String used as the decimal point in formatted numeric output.
//thousands_sep: String used as the thousands separator in formatted numeric output.
//grouping: String that defines the size of each group of digits in formatted numeric output.
//These fields control how numbers are formatted in terms of their decimal and thousands separators, as well as grouping of digits (like grouping in thousands).

//Monetary Fields
//int_curr_symbol: International currency symbol, typically followed by a space.
//currency_symbol: Local currency symbol.
//mon_decimal_point: Decimal point character used in monetary values.
//mon_thousands_sep: Thousands separator used in monetary values.
//mon_grouping: Similar to grouping, but used for formatting monetary values.
//positive_sign: String used to indicate positive monetary values.
//negative_sign: String used to indicate negative monetary values.
//int_frac_digits: Number of digits after the decimal point in an international monetary format.
//frac_digits: Number of digits after the decimal point in the local monetary format.
//p_cs_precedes: Indicates whether the currency symbol precedes the value for positive amounts.
//p_sep_by_space: Indicates whether a space separates the currency symbol from the value for positive amounts.
//n_cs_precedes: Indicates whether the currency symbol precedes the value for negative amounts.
//n_sep_by_space: Indicates whether a space separates the currency symbol from the value for negative amounts.
//p_sign_posn: Location of the positive sign in relation to the currency symbol and value.
//n_sign_posn: Location of the negative sign in relation to the currency symbol and value.

struct lconv *localeconv(void) {
	static struct lconv lconv_current;
	setup_current_locale_if_needed();

	memcpy(&lconv_current, __current_locale->lc_numeric?__current_locale->lc_numeric:__current_locale->lc_all, sizeof(struct lconv));
	struct lconv * mon = __current_locale->lc_monetary?__current_locale->lc_monetary:__current_locale->lc_all;
	lconv_current.mon_decimal_point=mon->mon_decimal_point;
	lconv_current.mon_thousands_sep=mon->mon_thousands_sep;
	lconv_current.mon_grouping=mon->mon_grouping;

	return &lconv_current;
}

// "C" for the minimal locale
static bool is_c_locale_name(const char* locale_name) {
	return (*locale_name=='C' && locale_name[1]==0) || strcmp(locale_name, "POSIX")==0;
}

//"" for the user-preferred locale 
static bool is_user_locale_name(const char* locale_name) {
	if (user_language==NULL) user_language=twrUserLanguage();
	return *locale_name==0 || strcmp(locale_name, user_language)==0;
}

static bool is_valid_locale_name(const char* locale_name) {
	return is_c_locale_name(locale_name) || is_user_locale_name(locale_name);
}

static struct lconv * get_static_lconv(const char* locale_name) {

	if (is_user_locale_name(locale_name)) {
		if (plconv_user==NULL) create_lconv_user();
		return plconv_user;
	}
	if (is_c_locale_name(locale_name)) return &lconv_C;

	assert(0);  // should never happen
	return NULL;
}

locale_t newlocale(int category_mask, const char *locale, locale_t base) {
	if (!is_valid_locale_name(locale)) {
		_set_errno(EINVAL);
		return (locale_t)0;
	}

	const unsigned int invmask= ~((unsigned int)LC_ALL_MASK);
	const unsigned int ucatm=(unsigned int)category_mask;

	if ( (invmask&ucatm) !=0) {
		_set_errno(EINVAL);
		return (locale_t)0;
	}

	if (base==NULL) {
		base=(locale_t)calloc(1, sizeof(struct __locale_t_struct));
		base->lc_all=&lconv_C;
	}

	if (category_mask==LC_ALL_MASK) {
		memset(base, 0, sizeof(struct __locale_t_struct));
		base->lc_all=get_static_lconv(locale);
		return base;
	}

	if (category_mask&LC_COLLATE_MASK) {
		base->lc_collate=get_static_lconv(locale);
	}

	if (category_mask&LC_CTYPE_MASK) {
		base->lc_ctype=get_static_lconv(locale);
	}

	if (category_mask&LC_MONETARY_MASK) {
		base->lc_monetary=get_static_lconv(locale);
	}

	if (category_mask&LC_NUMERIC_MASK) {
		base->lc_numeric=get_static_lconv(locale);
	}

	if (category_mask&LC_TIME_MASK) {
		base->lc_time=get_static_lconv(locale);
	}

	if (category_mask&LC_MESSAGES_MASK) {
		base->lc_message=get_static_lconv(locale);
	}

	return base;
}

locale_t	uselocale(locale_t loc) {
	setup_current_locale_if_needed();
	locale_t old = __current_locale;
	if (loc) __current_locale=loc;
	return old;
}

void freelocale(locale_t loc) {
	if (loc)	free(loc);
}

locale_t duplocale(locale_t locobj) {
	if (locobj==NULL) {
		_set_errno(EINVAL);
		return NULL;
	}

	const locale_t locnew=(locale_t)malloc(sizeof(struct __locale_t_struct));
	memcpy(locnew, locobj, sizeof(struct __locale_t_struct));
	return locnew;
}

static bool is_valid_category(int category) {
	return category>=0 && category<_LC_LAST;
}

static struct lconv** get_lconv_in_locale_t(int category, locale_t base) {
	if (category==LC_ALL) {
		return &base->lc_all;
	}

	if (category==LC_COLLATE) {
		return &base->lc_collate;
	}

	if (category==LC_CTYPE) {
		return &base->lc_ctype;
	}

	if (category==LC_MONETARY) {
		return &base->lc_monetary;
	}

	if (category==LC_NUMERIC) {
		return &base->lc_numeric;
	}

	if (category==LC_TIME) {
		return &base->lc_time;
	}

	if (category==LC_MESSAGES) {
		return &base->lc_message;
	}

	assert(0);

	return NULL;
}

char* setlocale(int category, const char* locale) {

	setup_current_locale_if_needed();

	if (locale==NULL) {  // query current category
		struct lconv *p = *get_lconv_in_locale_t(category, __current_locale);
		if (p==&lconv_C) return "C";
		if (p==plconv_user) return twrUserLanguage();
		assert(0);
		return "C";  // should never happen
	}

	else if (is_valid_locale_name(locale) &&  is_valid_category(category)) {
		const int catmask=category==LC_ALL?LC_ALL_MASK:1<<category;
		uselocale(newlocale(catmask, locale, __current_locale));
		if (is_user_locale_name(locale)) return user_language;
		else if (is_c_locale_name(locale)) return "C";
		else {
			assert(0);
			return NULL;
		}
	}

	else {
		return NULL;
	}
}

int locale_unit_test(void) {

	if (strcmp(setlocale(LC_ALL, NULL),"C")!=0) return 0;
	
	struct lconv * lc=localeconv();
	if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->thousands_sep[0]!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;
	
   char * r = setlocale(LC_ALL, "C");
	if (strcmp(r, "C")!=0) return 0;
	lc=localeconv();
	if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->thousands_sep[0]!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;

   r=setlocale(LC_ALL, "bogus");
	if (r!=NULL) return 0;
	lc=localeconv();
	if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->thousands_sep[0]!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;

   r=setlocale(LC_ALL, "");
	if (strcmp(r, twrUserLanguage())!=0) return 0;
	lc=localeconv();
	//if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	//if (lc->thousands_sep[0]!=',' || lc->thousands_sep[1]!=0) return 0;
	//if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
	//if (lc->mon_thousands_sep[0]!=',' || lc->mon_thousands_sep[1]!=0) return 0;
	twr_conlog("LC_ALL dec '%s' sep '%s' lang '%s'", lc->decimal_point, lc->thousands_sep, r);

   setlocale(LC_ALL, "POSIX");
   setlocale(LC_MONETARY, "");
	lc=localeconv();
	if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->thousands_sep[0]!=0) return 0;
	if (lc->mon_decimal_point[0]==0) return 0;
	if (lc->mon_thousands_sep[0]==0) return 0;

   setlocale(LC_NUMERIC, "");
   setlocale(LC_MONETARY, "C");
	lc=localeconv();
	char* lang_num=setlocale(LC_NUMERIC, NULL);  // should be user setting
	char* lang_mon=setlocale(LC_MONETARY, NULL);  // should be "C"

	if (strcmp(lang_mon,"C")!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;

	if (strcmp(lang_num,"fr")==0) {
		if (strcmp(lc->decimal_point, ",")!=0) return 0;
		if (strcmp(lc->thousands_sep, " ")!=0) return 0;
	}
	else if (strncmp(lang_num,"en",2)==0) {
		if (strcmp(lc->decimal_point, ".")!=0) return 0;
		if (strcmp(lc->thousands_sep, ",")!=0) return 0;
	}
	else if (strcmp(lang_num,"C")==0) return 0;
	else {
		printf("locale_unit_test lang '%s' not recognized, test skipped\n",lang_num);
	}

	locale_t nl=newlocale(LC_ALL_MASK, "C", (locale_t) 0);
	locale_t dl=duplocale(nl);
	locale_t	last=uselocale(nl);
	if (uselocale(0)!=nl) return 0;
	lc=localeconv();
	if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->thousands_sep[0]!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;
	last=uselocale(last);
	if (last!=nl) return 0;
	freelocale(nl);
	lc=localeconv();
	lang_num=setlocale(LC_NUMERIC, NULL);  // should be user setting
	lang_mon=setlocale(LC_MONETARY, NULL);  // should be "C"

	if (strcmp(lang_mon,"C")!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;

	if (strcmp(lang_num,"fr")==0) {
		if (strcmp(lc->decimal_point, ",")!=0) return 0;
		if (strcmp(lc->thousands_sep, " ")!=0) return 0;
	}
	else if (strncmp(lang_num,"en",2)==0) {
		if (strcmp(lc->decimal_point, ".")!=0) return 0;
		if (strcmp(lc->thousands_sep, ",")!=0) return 0;
	}
	else if (strcmp(lang_num,"C")==0) return 0;
	else {
		printf("locale_unit_test lang '%s' not recognized, test skipped (x2)\n",lang_num);
	}

	last=uselocale(dl);
	lc=localeconv();
	if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
	if (lc->thousands_sep[0]!=0) return 0;
	if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
	if (lc->mon_thousands_sep[0]!=0) return 0;

	last=uselocale(last);
	if (last!=dl) return 0;
	freelocale(dl);

	last=uselocale(0);
	uselocale(LC_GLOBAL_LOCALE);
	if (last!=uselocale(0)) return 0;

	setlocale(LC_ALL, "C");
	
	return 1;
}