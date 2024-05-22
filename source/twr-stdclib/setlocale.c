#include <locale.h>
#include <stddef.h>
#include <limits.h>
#include <string.h>
#include <errno.h>
#include <stdlib.h>
#include <assert.h>
#include <twr-jsimports.h>
#include <stdio.h>

// "C", "", and ".1252" locales supported
//
//   "C" or "POSIX"
//	   as is normal with the C standard library, this is the default (see setlocale() std c lib docs)
//		printf, etc, will work with UTF-8 since our stdio terminal supports UTF-8 (this is how modern gcc works)
//    isgraph() style functions will only recognize ASCII characters, as is normal
//    str collate() functions use lexical ordering, as is normal
//		locale specific decimal and separators are NOT used (see the standard C library setlocale() docs)
//
//	  ""
//   The Javascript/browser user defaults for language and region are used, and this locale ALWAYS uses utf8 character encoding (eg. en_US.UTF-8)
//    isgraph style functions will only recognize ASCII characters (since UTF-8 doesn't encode any single bytes greater than 127), as is normal
//    str collate functions use locale specific ordering, as is normal
//		locale specific decimal and separators ARE used 

//	".1252"
//   This is the same as "", except that Windows-1252 character encoding is used instead of utf-8
//   Windows-1252 is a super set of ISO-8859-1
//   Windows-1252 is the most commonly used encoding for european languages when unicode is not used
//   This mode is primarily for legacy software / backwards compatibly.  UTF-8 is the web standard and widly used now.
//   Modern text editors generally default to UTF-8.  In order to use 1252 string literals, you may need to:
//       - Configure your text editor to save in Windows-1252/ISO-8859-1 format (instead of UTF-8)
//       - use compiler flags like --finput-charset and -fexec-charset

// notes:
// on my windows config, only -fexec-charset=utf-8 seems to work (not -fexec-charset=windows-1252 for example).  
// -fexec-charset=utf-8 also seems to be the default.
// by 2000 most web browsers and e-mail clients treated the charsets ISO-8859-1 and US-ASCII as Windows-1252
// my windows default locale: Locale after setting to default: English_United States.1252
// my bash default: LANG=en_US.UTF-8
//

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

static struct __locale_t_struct locale_C = {
	&lconv_C,
	NULL,
	NULL,	
	NULL,	
	NULL,	
	NULL
};

static struct lconv *plconv_user_utf8;  // the user default struct lconv, UTF-8 char encoding
static struct lconv *plconv_user_1252;  // the user default struct lconv, 1252 char encoding
static char* user_language; // language may include the region, ala "en-US", or may not, ala "fr"
int user_language_len;

static locale_t current_locale;

extern inline locale_t __get_current_locale(void) {
	if (current_locale==0)
		current_locale=__get_static_locale_c();
	return current_locale;
}

static void  __set_current_locale(locale_t loc) {
	current_locale=loc;
}

extern inline locale_t __get_static_locale_c() {
	return &locale_C;
}

extern inline struct lconv * __get_locale_lc_ctype(locale_t loc) {
	return loc->lc_ctype?loc->lc_ctype:loc->lc_all;
}

extern inline struct lconv * __get_locale_lc_numeric(locale_t loc) {
	return loc->lc_numeric?loc->lc_numeric:loc->lc_all;
}

extern inline struct lconv * __get_locale_lc_monetary(locale_t loc) {
	return loc->lc_monetary?loc->lc_monetary:loc->lc_all;
}

extern inline struct lconv * __get_locale_lc_collate(locale_t loc) {
	return loc->lc_collate?loc->lc_collate:loc->lc_all;
}

extern inline bool __is_c_locale(struct lconv * lcp) {
	return lcp==&lconv_C;
}

extern inline bool __is_utf8_locale(struct lconv * lcp) {
	return lcp==plconv_user_utf8;
}

extern inline bool __is_1252_locale(struct lconv * lcp) {
	return lcp==plconv_user_1252;
}

static void create_lconv_user(struct lconv **puser) {
	assert(*puser==NULL);
	*puser=malloc(sizeof(struct lconv));
	memcpy(*puser, &lconv_C, sizeof(struct lconv));
	twrUserLconv(*puser);
	if (user_language==NULL) user_language=twrUserLanguage();
}

static void create_lconv_user_utf8(void) {
	create_lconv_user(&plconv_user_utf8);
}

static void create_lconv_user_1252(void) {
	create_lconv_user(&plconv_user_1252);
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

	memcpy(&lconv_current, __get_locale_lc_numeric(__get_current_locale()), sizeof(struct lconv));
	struct lconv * mon = __get_locale_lc_monetary(__get_current_locale());
	lconv_current.mon_decimal_point=mon->mon_decimal_point;
	lconv_current.mon_thousands_sep=mon->mon_thousands_sep;
	lconv_current.mon_grouping=mon->mon_grouping;

	return &lconv_current;
}

// "C" for the minimal locale
static bool is_c_locale_name(const char* locale_name) {
	return (*locale_name=='C' && locale_name[1]==0) || strcmp(locale_name, "POSIX")==0;
}

void set_user_lang(void) {
	if (user_language==NULL) {
		user_language=twrUserLanguage();
		user_language_len=strlen(user_language);
	}
}

//"" or ".utf-8" for the user-preferred locale in UTF-8 encoding
static bool is_user_utf8_name(const char* locale_name) {
	set_user_lang();
	return *locale_name==0 || 
			(stricmp(locale_name, ".utf-8")==0 || stricmp(locale_name, ".utf8")==0) ||
			(strncmp(locale_name, user_language, user_language_len)==0 && 
			  		(stricmp(locale_name+user_language_len, ".utf-8")==0 || stricmp(locale_name+user_language_len, ".utf8")==0));
}

static bool is_user_1252_name(const char* locale_name) {
	set_user_lang();
	return
			stricmp(locale_name, ".1252")==0  ||
			(strncmp(locale_name, user_language, user_language_len)==0 && stricmp(locale_name+user_language_len, ".1252")==0 );
}

static bool is_valid_locale_name(const char* locale_name) {
	return is_c_locale_name(locale_name) || is_user_utf8_name(locale_name) || is_user_1252_name(locale_name);
}

static struct lconv * get_lconv_by_name(const char* locale_name) {

	if (is_user_utf8_name(locale_name)) {
		if (plconv_user_utf8==NULL) create_lconv_user_utf8();
		return plconv_user_utf8;
	}
	else if (is_user_1252_name(locale_name)) {
		if (plconv_user_1252==NULL) create_lconv_user_1252();
		return plconv_user_1252;
	}
	else if (is_c_locale_name(locale_name)) return &lconv_C;

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

	if (base==NULL || base==__get_static_locale_c()) {
		base=(locale_t)calloc(1, sizeof(struct __locale_t_struct));
		base->lc_all=&lconv_C;
	}

	if (category_mask==LC_ALL_MASK) {
		memset(base, 0, sizeof(struct __locale_t_struct));
		base->lc_all=get_lconv_by_name(locale);
		return base;
	}

	if (category_mask&LC_COLLATE_MASK) {
		base->lc_collate=get_lconv_by_name(locale);
	}

	if (category_mask&LC_CTYPE_MASK) {
		base->lc_ctype=get_lconv_by_name(locale);
	}

	if (category_mask&LC_MONETARY_MASK) {
		base->lc_monetary=get_lconv_by_name(locale);
	}

	if (category_mask&LC_NUMERIC_MASK) {
		base->lc_numeric=get_lconv_by_name(locale);
	}

	if (category_mask&LC_TIME_MASK) {
		base->lc_time=get_lconv_by_name(locale);
	}

	if (category_mask&LC_MESSAGES_MASK) {
		base->lc_message=get_lconv_by_name(locale);
	}

	return base;
}

locale_t	uselocale(locale_t loc) {
	locale_t old = __get_current_locale();
	if (loc) __set_current_locale(loc);
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

static char* get_lconv_name(struct lconv *p) {
	static char name[16]; // max len should be "en-US.UTF-8" aka 12
	if (__is_c_locale(p)) return "C";
	strcpy(name, user_language);
	if (p==plconv_user_utf8) {
		strcat(name, ".UTF-8");
		return name;
	}
	else if (p==plconv_user_1252) {
		strcat(name, ".1252");
		return name;
	}
	else {
		assert(0);
		return "";
	}
}

char* setlocale(int category, const char* locale) {

	if (locale==NULL) {  // query current category
		struct lconv *p = *get_lconv_in_locale_t(category, __get_current_locale());
		return get_lconv_name(p);
	}

	else if (is_valid_locale_name(locale) &&  is_valid_category(category)) {
		const int catmask=category==LC_ALL?LC_ALL_MASK:1<<category;
		uselocale(newlocale(catmask, locale, __get_current_locale()));
		struct lconv *p = *get_lconv_in_locale_t(category, __get_current_locale());
		return get_lconv_name(p);
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
	const char*lang=twrUserLanguage();  // language may include the region, ala "en-US", or may not, ala "fr"
	if (!(strlen(lang)==5 || strlen(lang)==2)) return 0;
	if (strncmp(r, lang, strlen(lang))!=0) return 0;
	if (strcmp(r+strlen(lang), ".UTF-8")!=0) return 0;
	lc=localeconv();
	printf("locale \"\" lang '%s' decimal '%s' sep '%s'  currency sym '%s'\n", r, lc->decimal_point, lc->thousands_sep, lc->currency_symbol);
	if (strcmp(lang,"en-US")==0) {
		if (lc->decimal_point[0]!='.' || lc->decimal_point[1]!=0) return 0;
		if (lc->thousands_sep[0]!=',' || lc->thousands_sep[1]!=0) return 0;
		if (lc->mon_decimal_point[0]!='.' || lc->mon_decimal_point[1]!=0) return 0;
		if (lc->mon_thousands_sep[0]!=',' || lc->mon_thousands_sep[1]!=0) return 0;
		if (lc->positive_sign[0]!='+'|| lc->positive_sign[1]!=0) return 0;
		if (lc->negative_sign[0]!='-'|| lc->negative_sign[1]!=0) return 0;
		if (lc->int_curr_symbol[0]!='$'|| lc->int_curr_symbol[1]!=0) return 0;
		if (lc->currency_symbol[0]!='$'|| lc->currency_symbol[1]!=0) return 0;
	}
	else if (strncmp(lang,"fr",2)==0) {
		if (lc->decimal_point[0]!=',' || lc->decimal_point[1]!=0) return 0;
		if (lc->thousands_sep[0]!=' ' || lc->thousands_sep[1]!=0) return 0;
		if (lc->mon_decimal_point[0]!=',' || lc->mon_decimal_point[1]!=0) return 0;
		if (lc->mon_thousands_sep[0]!=' ' || lc->mon_thousands_sep[1]!=0) return 0;
		if (lc->positive_sign[0]!='+'|| lc->positive_sign[1]!=0) return 0;
		if (lc->negative_sign[0]!='-'|| lc->negative_sign[1]!=0) return 0;
		if (strcmp(lc->int_curr_symbol, "€")!=0) return 0;
		if (strcmp(lc->currency_symbol, "€")!=0) return 0;
	}
	else {
		printf("locale_unit_test lang '%s' not recognized, test skipped %d\n",lang, __LINE__);
	}


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

	if (strncmp(lang_num,"fr",2)==0) {
		if (strcmp(lc->decimal_point, ",")!=0) return 0;
		if (strcmp(lc->thousands_sep, " ")!=0) return 0;
	}
	else if (strncmp(lang_num,"en",2)==0) {
		if (strcmp(lc->decimal_point, ".")!=0) return 0;
		if (strcmp(lc->thousands_sep, ",")!=0) return 0;
	}
	else if (strcmp(lang_num,"C")==0) return 0;
	else {
		printf("locale_unit_test lang '%s' not recognized, test skipped %d\n",lang_num, __LINE__);
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

	if (strncmp(lang_num,"fr",2)==0) {
		if (strcmp(lc->decimal_point, ",")!=0) return 0;
		if (strcmp(lc->thousands_sep, " ")!=0) return 0;
	}
	else if (strncmp(lang_num,"en",2)==0) {
		if (strcmp(lc->decimal_point, ".")!=0) return 0;
		if (strcmp(lc->thousands_sep, ",")!=0) return 0;
	}
	else if (strcmp(lang_num,"C")==0) return 0;
	else {
		printf("locale_unit_test lang '%s' not recognized, test skipped %d\n",lang_num, __LINE__);
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

	r=setlocale(LC_ALL, ".1252");
	lang=twrUserLanguage();
	if (!(strlen(lang)==5 || strlen(lang)==2)) return 0;
	if (strncmp(r, lang, strlen(lang))!=0) return 0;
	if (strcmp(r+strlen(lang), ".1252")!=0) return 0;

	setlocale(LC_ALL, "C");
	
	return 1;
}