#include <ctype.h>

extern locale_t __current_locale;

int isascii(int c) {
	return c>=0 && c<=127;
}

int toascii(int c) {
	return c&0x127;
}

int isalnum(int c) {
	return isalnum_l(c, __current_locale);
}

int isalpha(int c) {
	return isalpha_l(c, __current_locale);
}

int isblank(int c) {
	return isblank_l(c, __current_locale);
}

int iscntrl(int c) {
	return iscntrl_l(c, __current_locale);
}

int isdigit(int c) {
	return isdigit_l(c, __current_locale);
}

int isgraph(int c) {
	return isgraph_l(c, __current_locale);
}

int islower(int c) {
	return islower_l(c,  __current_locale);
}

int isprint(int c) {
	return isprint_l(c,  __current_locale);
}

int ispunct(int c) {
	return ispunct_l(c, __current_locale);
}

int isspace(int c) {
	return isspace_l(c, __current_locale);
}

int isupper(int c) {
	return isupper_l(c, __current_locale);
}

int isxdigit(int c) {
	return isxdigit_l(c, __current_locale);
}

int tolower(int c) {
	return tolower_l(c, __current_locale);
}

int toupper(int c) {
	return toupper_l(c, __current_locale);
}

int isalnum_l(int c, locale_t loc) {
	return isdigit_l(c, loc) || isalpha_l(c, loc);
}

int isalpha_l(int c, locale_t  __attribute__((__unused__)) loc) {
	return (c>='a' && c<='z') || (c>='A' && c<='Z');
}

int isblank_l(int c, locale_t  __attribute__((__unused__)) loc) {
	return c==0x20 || c==0x09;
}

int iscntrl_l(int c, locale_t  __attribute__((__unused__)) loc) {
	return (c>=0x00 && c<=0x1F) || c==0x7F;
}

int isdigit_l(int c, locale_t  __attribute__((__unused__)) loc) {
	return c>='0' && c<='9';
}

int isgraph_l(int c, locale_t  __attribute__((__unused__)) loc) {
	if (c >='!' && c <= '~') return 1;
	else return 0;
}

int islower_l(int c, locale_t  __attribute__((__unused__)) loc) {
	return c>='a' && c<='z';
}

int isprint_l(int c, locale_t loc) {
	return isalnum_l(c, loc) || ispunct_l(c, loc) || c==0x20;
}

int ispunct_l(int c, locale_t  __attribute__((__unused__)) loc) {
	const char *valid="!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
	int i=0;
	while (valid[i]) {
		if (valid[i]==c) return 1;
		i++;
	}

	return 0;
}

//In the POSIX locale, at a minimum, the <space>, <form-feed>, <newline>, <carriage-return>, <tab>, and <vertical-tab> shall be included.
int isspace_l(int c, locale_t  __attribute__((__unused__)) loc) {
	if (c==' ' || c=='\f' || c=='\n'  || c=='\r'  || c=='\t'  || c=='\v' )
		return 1;
	else
		return 0;
}

int isupper_l(int c, locale_t  __attribute__((__unused__)) loc) {
	return c>='A' && c<='Z';
}

int isxdigit_l(int c, locale_t  loc) {
	return isdigit_l(c, loc) || (c>='a' && c<='f') || ((c>='A' && c<='F'));
}

int tolower_l(int c, locale_t  __attribute__((__unused__)) loc) {
	if (c>='A' && c<='Z')
		return c-'A'+'a';
	else
		return c;
}

int toupper_l(int c, locale_t  __attribute__((__unused__)) loc) {
	if (c>='a' && c<='z')
		return c-'a'+'A';
	else
		return c;
}


int char_unit_test() {
	if (isascii('g')!=1) return 0;

	if (toascii('Y'|128)!='Y') return 0;

	if (isalnum('!')) return 0;
	if (!isalnum('t')) return 0;
	if (!isalnum('0')) return 0;

	if (isalpha('1')) return 0;
	if (!isalpha('a')) return 0;
	if (!isalpha('Z')) return 0;
	if (isalpha('#')) return 0;

	if (!isblank(' ')) return 0;
	if (isblank('*')) return 0;

	if (iscntrl('6')) return 0;
	if (!iscntrl(7)) return 0;

	if (isdigit('a')) return 0;
	if (!isdigit('0')) return 0;
	if (!isdigit('9')) return 0;

	if (!isgraph('~')) return 0;
	if (isgraph(13)) return 0;

	if (islower('A')) return 0;
	if (!islower('z')) return 0;

	if (isprint(127)) return 0;
	if (!isprint(' ')) return 0;
	if (!isprint('A')) return 0;
	if (!isprint('!')) return 0;

	if (ispunct(127)) return 0;
	if (!ispunct('@')) return 0;
	if (!ispunct('\\')) return 0;
	if (!ispunct('!')) return 0;
	
	if (isspace(127)) return 0;
	if (isspace('b')) return 0;
	if (!isspace(' ')) return 0;
	if (!isspace('\t')) return 0;

	if (isupper('a')) return 0;
	if (isupper('!')) return 0;
	if (!isupper('Z')) return 0;

	if (isxdigit('G')) return 0;
	if (!isxdigit('0')) return 0;
	if (!isxdigit('f')) return 0;
	if (!isxdigit('A')) return 0;
	
	if (tolower('a')!='a') return 0;
	if (tolower('A')!='a') return 0;
	if (tolower('$')!='$') return 0;
	if (tolower('Z')!='z') return 0;
	if (tolower('5')!='5') return 0;


	if (toupper('a')!='A') return 0;
	if (toupper('A')!='A') return 0;
	if (toupper('$')!='$') return 0;
	if (toupper('z')!='Z') return 0;

	return 1;
}


