#include <ctype.h>

int isgraph( int ch )
{
	if (ch >='!' && ch <= '~') return 1;

	else return 0;
}

//In the POSIX locale, at a minimum, the <space>, <form-feed>, <newline>, <carriage-return>, <tab>, and <vertical-tab> shall be included.
int isspace(int c) {
	if (c==' ' || c=='\f' || c=='\n'  || c=='\r'  || c=='\t'  || c=='\v' )
		return 1;

	else
		return 0;
}

int isdigit(int c) {
	return c>='0' && c<='9';
}

int isalpha(int c) {
	return (c>='a' && c<='z') || (c>='A' && c<='Z');
}

int isalnum(int c) {
	return isdigit(c) || isalpha(c);
}

int toupper(int c) {
	if (c>='a' && c<='z')
		return c-'a'+'A';
	else
		return c;
}

int tolower(int c) {
	if (c>='A' && c<='Z')
		return c-'A'+'a';
	else
		return c;
}


int char_unit_test() {
	if (toupper('a')!='A') return 0;
	if (toupper('A')!='A') return 0;
	if (toupper('$')!='$') return 0;
	if (tolower('Z')!='z') return 0;
	if (tolower('5')!='5') return 0;

	if (isdigit('a')) return 0;
	if (!isdigit('0')) return 0;
	if (!isdigit('9')) return 0;

	if (isalpha('1')) return 0;
	if (!isalpha('a')) return 0;
	if (!isalpha('Z')) return 0;
	if (isalpha('#')) return 0;

	return 1;
}


