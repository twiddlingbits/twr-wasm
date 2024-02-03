#include "twr-crt.h"

int twr_isgraph( int ch )
{
	if (ch >='!' && ch <= '~') return 1;

	else return 0;
}

//In the POSIX locale, at a minimum, the <space>, <form-feed>, <newline>, <carriage-return>, <tab>, and <vertical-tab> shall be included.
int twr_isspace(int c) {
	if (c==' ' || c=='\f' || c=='\n'  || c=='\r'  || c=='\t'  || c=='\v' )
		return 1;

	else
		return 0;
}

int twr_isdigit(int c) {
	return c>='0' && c<='9';
}

int twr_isalpha(int c) {
	return (c>='a' && c<='z') || (c>='A' && c<='Z');
}

int twr_isalnum(int c) {
	return twr_isdigit(c) || twr_isalpha(c);
}

int twr_toupper(int c) {
	if (c>='a' && c<='z')
		return c-'a'+'A';
	else
		return c;
}

int twr_tolower(int c) {
	if (c>='A' && c<='Z')
		return c-'A'+'a';
	else
		return c;
}


int twr_char_unit_test() {
	if (twr_toupper('a')!='A') return 0;
	if (twr_toupper('A')!='A') return 0;
	if (twr_toupper('$')!='$') return 0;
	if (twr_tolower('Z')!='z') return 0;
	if (twr_tolower('5')!='5') return 0;

	if (twr_isdigit('a')) return 0;
	if (!twr_isdigit('0')) return 0;
	if (!twr_isdigit('9')) return 0;

	if (twr_isalpha('1')) return 0;
	if (!twr_isalpha('a')) return 0;
	if (!twr_isalpha('Z')) return 0;
	if (twr_isalpha('#')) return 0;

	return 1;
}


