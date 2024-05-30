#include <locale.h>
#include <stddef.h>
#include <limits.h>
#include <string.h>
#include <errno.h>
#include <stdlib.h>
#include <assert.h>
#include <twr-jsimports.h>
#include <stdio.h>

/* TO DO:
printf supports UTF8, but not Win 1252 (DONE)
printf works with UTF8 on linux/gcc because the terminal supports UTF8.  Not sure if windows does.  I Do.  (DONE)
Putstring in ts needs to support win 1252 (DONE)
add ALL win-1252 chars to to1252() in tolocale.ts  (DONE)
mod.getString(strIndex:number, len?:number, encodeFormat='utf-8')  - should it be using codepage? (SEEMS OKAY)
when utf-8 locale is set (""), library functions need to support utf8 (like strcmp?) (NO they use lexical - Think this is OKAY)
Does TS lconv encode currency in 1252 correctly?  (YES))
Convert - to underscore in lang (NO - kept BCP 47 format)
Utf8/win1252 key input (DONE)
do i want to allow esc in key input? yes. (DONE)
correctly handle arrowup arrowdown keys; modify term example to use both u and uparrow, or d and downarrow (DONE)
remove whatkey from code (DONE)
Utf8/win1252 for winterm (DONE)
update wincon to support utf-8 (trs-80 graphics might still be possible, need to convert to unicode) (DONE)
getchar(), io_getc(), getc(stdin), fgetc(stdin), all do the same thing, and all return an in unicode CodePoint.  Document. (DONE)
update draw_trs80_graphic to use unicode range (DONE)
make this faster by checking fpr ascii range: int r=twrCodePageToUnicodeCodePoint(c, cp); (DONE)
add colors to winterm (demo that draws border cant be seen in foreground color) (DONE)
remove trs-80 codes 192+ from doc (no longer supported since utf-8 added) (Not in DOC - so DONE)
remove this line when unicode supported: if (thousandsSeparator.charCodeAt(0)==8239) thousandsSeparator=' ' (DONE)
fix bug: io_gets() backspace assumes utf8 or ascii encoding (DONE)
add start/end sequence around large graphic console draws to go faster (DONE)
change d2d_ text functions that take a string to use utf-8 (window-1252 as well) (DONE)
minor setlocale.c cleanup. p==plconv_user_1252 should be replaced with __is_1252_locale()  (DONE)
expose twrUnicodeCodePointToCodePage, twrCodePageToUnicodeCodePoint, to C API (twr_)
add twr_get_navlang() that calls twrUserLanguage() (DONE)
should i add a function that gets the full key, like "Shift"?
putc UTF-8 support is in iodiv.c,but set_c support is in io.c.  should they both be in io.c?
change charCodeAt() to codepointAt where 32 bit results are fine?
Strftime
Strxfrm
Doc (DONE)
add win-1252 input test case?
More test cases? eg. io_gets, £, backspace, using 1252 encoding
Review all locale changes
should i changed boot up default to "" instead of "C"?  if so, should i change C to be ASCII all the time?

ADD ansi terminal escape codes for windows term
\x1b[30m - Black
\x1b[31m - Red
\x1b[32m - Green
\x1b[33m - Yellow
\x1b[34m - Blue
\x1b[35m - Magenta
\x1b[36m - Cyan
\x1b[37m - White
\x1b[0m - Reset to default

rename windows console to terminal
*/

// "C", "", and ".1252" locales supported
//
//   "C" or "POSIX"
//	   as is normal with the C standard library, this is the default (see setlocale() std c lib docs)
//		printf, etc, will work with UTF-8 since our stdio terminal supports UTF-8 (this is how modern gcc works)
//    isgraph() style functions will only recognize ASCII characters, as is normal
//    strcmp() type functions may produce unexpected results (comparison for equality will work)
//    str collate() functions use lexical ordering, as is normal
//		locale specific decimal and separators are NOT used (see the standard C library setlocale() docs)
//
//    By default, the Microsoft Visual Studio C compiler (MSVC) does not treat string literals as UTF-8. 
//    Instead, it treats them as being encoded in the current code page of the system, which is typically Windows-1252 on 
//    English-language Windows systems.
//
//	  ""
//   The Javascript/browser user defaults for language and region are used, and this locale ALWAYS uses utf8 character encoding (eg. en_US.UTF-8)
//    isgraph style functions will only recognize ASCII characters (since UTF-8 doesn't encode any single bytes greater than 127), as is normal
//    str collate functions use locale specific ordering, as is normal
//		strcmp etc --compares two strings lexicographically (byte-by-byte) without considering locale-specific rules.  
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
static int user_language_len;

static locale_t current_locale;

extern inline locale_t twr_get_current_locale(void) {
	if (current_locale==0)
		current_locale=__get_static_locale_c();
	return current_locale;
}

static void  __set_current_locale(locale_t loc) {
	current_locale=loc;
}

extern inline locale_t __get_static_locale_c(void) {
	return &locale_C;
}

extern inline struct lconv * __get_lconv_lc_ctype(locale_t loc) {
	return loc->lc_ctype?loc->lc_ctype:loc->lc_all;
}

extern inline struct lconv * __get_lconv_lc_numeric(locale_t loc) {
	return loc->lc_numeric?loc->lc_numeric:loc->lc_all;
}

extern inline struct lconv * __get_lconv_lc_monetary(locale_t loc) {
	return loc->lc_monetary?loc->lc_monetary:loc->lc_all;
}

extern inline struct lconv * __get_lconv_lc_collate(locale_t loc) {
	return loc->lc_collate?loc->lc_collate:loc->lc_all;
}

extern inline bool __is_c_locale(const struct lconv * lcp) {
	return lcp==&lconv_C;
}

extern inline bool __is_utf8_locale(const struct lconv * lcp) {
	return lcp==plconv_user_utf8;
}

extern inline bool __is_1252_locale(const struct lconv * lcp) {
	return lcp==plconv_user_1252;
}

int __get_current_lc_ctype_code_page(void) {
	const struct lconv* lcc = __get_lconv_lc_ctype(twr_get_current_locale());
	return __get_code_page(lcc);
}

int __get_current_lc_ctype_code_page_modified(void) {

	const struct lconv* lcc = __get_lconv_lc_ctype(twr_get_current_locale());
	int cp;
	if (__is_c_locale(lcc))
		cp=TWR_CODEPAGE_UTF8;  // we allow UTF-8 chars that are printf'd or otherwise flow to a console to work
	else
		cp=__get_code_page(lcc);

	return cp;
}


void twr_localize_numeric_string(char* str, locale_t locale) {
	char decimal=__get_lconv_lc_numeric(locale)->decimal_point[0];
	char* dp=strchr(str, '.');
	if (dp) *dp=decimal;
}

int __get_code_page(const struct lconv * lcp) {
	if (__is_c_locale(lcp))
		return TWR_CODEPAGE_ASCII;  // ASCII
	else if (__is_utf8_locale(lcp))
		return TWR_CODEPAGE_UTF8;  // UTF8  
	else if (__is_1252_locale(lcp))
		return TWR_CODEPAGE_1252;   // 1252
	else {
		assert(0);
		return TWR_CODEPAGE_ASCII;
	}
}

static void set_user_lang(void) {
	if (user_language==NULL) {
		user_language=twrUserLanguage();
		user_language_len=strlen(user_language);
	}
}

static void create_lconv_user(struct lconv **puser, int code_page) {
	assert(*puser==NULL);
	*puser=malloc(sizeof(struct lconv));
	memcpy(*puser, &lconv_C, sizeof(struct lconv));
	twrUserLconv(*puser, code_page);
	set_user_lang();
}

static void create_lconv_user_utf8(void) {
	create_lconv_user(&plconv_user_utf8, TWR_CODEPAGE_UTF8);
}

static void create_lconv_user_1252(void) {
	create_lconv_user(&plconv_user_1252, TWR_CODEPAGE_1252);
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

	memcpy(&lconv_current, __get_lconv_lc_numeric(twr_get_current_locale()), sizeof(struct lconv));
	struct lconv * mon = __get_lconv_lc_monetary(twr_get_current_locale());
	lconv_current.mon_decimal_point=mon->mon_decimal_point;
	lconv_current.mon_thousands_sep=mon->mon_thousands_sep;
	lconv_current.mon_grouping=mon->mon_grouping;

	return &lconv_current;
}

// "C" for the minimal locale
static bool is_c_locale_name(const char* locale_name) {
	return (*locale_name=='C' && locale_name[1]==0) || strcmp(locale_name, "POSIX")==0;
}

//"" or ".utf-8" for the user-preferred locale in UTF-8 encoding
static bool is_user_utf8_name(const char* locale_name) {
	set_user_lang();
	return *locale_name==0 || 
			(stricmp(locale_name, ".utf-8")==0 || stricmp(locale_name, ".utf8")==0) ||
			(strncmp(locale_name, user_language, user_language_len)==0 && 
			  		(stricmp(locale_name+user_language_len, ".utf-8")==0 || stricmp(locale_name+user_language_len, ".utf8")==0));
}

// ".1252" for the user-preferred locale in .1252 encoding
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
	locale_t old = twr_get_current_locale();
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
	switch (category) {
		case LC_ALL:
			return &base->lc_all;

		case LC_COLLATE:
			return &base->lc_collate;

		case LC_CTYPE:
			return &base->lc_ctype;

	   case LC_MONETARY:
			return &base->lc_monetary;

	   case LC_NUMERIC:
			return &base->lc_numeric;

	   case LC_TIME:
			return &base->lc_time;

	   case LC_MESSAGES:
			return &base->lc_message;
	}

	assert(0);

	return NULL;
}

static char* get_lconv_name(struct lconv *p) {
	static char name[16]; // max len should be "en-US.UTF-8" ie 12
	if (__is_c_locale(p)) return "C";
	strcpy(name, user_language);
	if (__is_utf8_locale(p)) {
		strcat(name, ".UTF-8");
		return name;
	}
	else if (__is_1252_locale(p)) {
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
		struct lconv *p = *get_lconv_in_locale_t(category, twr_get_current_locale());
		if (p==NULL) p=twr_get_current_locale()->lc_all;
		return get_lconv_name(p);
	}

	else if (is_valid_locale_name(locale) &&  is_valid_category(category)) {
		const int catmask=category==LC_ALL?LC_ALL_MASK:1<<category;
		uselocale(newlocale(catmask, locale, twr_get_current_locale()));
		struct lconv *p = *get_lconv_in_locale_t(category, twr_get_current_locale());
		if (p==NULL) p=twr_get_current_locale()->lc_all;
		return get_lconv_name(p);
	}

	else {
		return NULL;
	}
}

//////////////////////////////////////////////////////////////////////////

const char* twr_get_navlang(int *len) {
	set_user_lang();
	if (len) *len=user_language_len;
	return user_language;
}

//////////////////////////////////////////////////////////////////////////


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
	int langlen;
	const char*lang=twr_get_navlang(&langlen);  // language may include the region, ala "en-US", or may not, ala "fr"
	if (langlen!=strlen(lang)) return 0;
	if (!(langlen==5 || langlen==2)) return 0;
	if (strncmp(r, lang, langlen)!=0) return 0;
	if (strcmp(r+langlen, ".UTF-8")!=0) return 0;
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
		if (strcmp(lc->thousands_sep, "\xE2\x80\xAF")!=0) return 0;   // UTF-8 narrow non-breaking space
		if (lc->mon_decimal_point[0]!=',' || lc->mon_decimal_point[1]!=0) return 0;
		if (strcmp(lc->mon_thousands_sep, "\xE2\x80\xAF")!=0) return 0;   // UTF-8 narrow non-breaking space
		if (lc->positive_sign[0]!='+'|| lc->positive_sign[1]!=0) return 0;
		if (lc->negative_sign[0]!='-'|| lc->negative_sign[1]!=0) return 0;
		if (strcmp(lc->int_curr_symbol, "€")!=0) return 0;
		if (strcmp(lc->currency_symbol, "€")!=0) return 0;

		setlocale(LC_ALL, ".1252");
		lc=localeconv();
		if (strcmp(lc->int_curr_symbol, "\x80")!=0) return 0;   // euro in windows-1252==0x80
		if (strcmp(lc->thousands_sep, " ")!=0) return 0;   
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
		if (strcmp(lc->thousands_sep, "\xE2\x80\xAF")!=0) return 0;   // UTF-8 narrow non-breaking space

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
		if (strcmp(lc->thousands_sep, "\xE2\x80\xAF")!=0) return 0;
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

	char locname[40];
	strcpy(locname, setlocale(LC_ALL, ".1252"));
	if (!__is_1252_locale(twr_get_current_locale()->lc_all)) return 0;
	setlocale(LC_ALL, "C");
	if (!__is_c_locale(twr_get_current_locale()->lc_all)) return 0;
	setlocale(LC_ALL, locname);
	if (!__is_1252_locale(twr_get_current_locale()->lc_all)) return 0;
	lang=twr_get_navlang(NULL);
	if (!(strlen(lang)==5 || strlen(lang)==2)) return 0;
	if (strncmp(r, lang, strlen(lang))!=0) return 0;
	if (strcmp(r+strlen(lang), ".1252")!=0) return 0;

	strcpy(locname, setlocale(LC_ALL, ""));
	if (!__is_utf8_locale(twr_get_current_locale()->lc_all)) return 0;
	setlocale(LC_ALL, "C");
	if (!__is_c_locale(twr_get_current_locale()->lc_all)) return 0;
	r=setlocale(LC_ALL, locname);
	if (!__is_utf8_locale(twr_get_current_locale()->lc_all)) return 0;
	if (strcmp(r, locname)!=0) return 0;

	setlocale(LC_ALL, "C");
	
	return 1;
}