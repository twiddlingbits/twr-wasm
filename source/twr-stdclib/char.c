#include <ctype.h>
#include <twr-jsimports.h>

// debug versions of these functions assert that "int c" is a valid "unsigned char" or EOF(-1) per the spec
// isalpha() type functions seem to accept ISO-8859-1 in gcc, so that we do as well.
// ISO-8859-1 also maps to the first 256 unicode codepoints

int isascii(int c) {
	return c>=0 && c<=127;
}

int toascii(int c) {
	return c&127;
}

int isalnum(int c) {
	return isalnum_l(c, __get_current_locale());
}

int isalpha(int c) {
	return isalpha_l(c, __get_current_locale());
}

int isblank(int c) {
	return isblank_l(c, __get_current_locale());
}

int iscntrl(int c) {
	return iscntrl_l(c, __get_current_locale());
}

int isdigit(int c) {
	return isdigit_l(c, __get_current_locale());
}

int isgraph(int c) {
	return isgraph_l(c, __get_current_locale());
}

int islower(int c) {
	return islower_l(c,  __get_current_locale());
}

int isprint(int c) {
	return isprint_l(c,  __get_current_locale());
}

int ispunct(int c) {
	return ispunct_l(c, __get_current_locale());
}

int isspace(int c) {
	return isspace_l(c, __get_current_locale());
}

int isupper(int c) {
	return isupper_l(c, __get_current_locale());
}

int isxdigit(int c) {
	return isxdigit_l(c, __get_current_locale());
}

int tolower(int c) {
	return tolower_l(c, __get_current_locale());
}

int toupper(int c) {
	return toupper_l(c, __get_current_locale());
}

///////////////////////////////////////////////

static bool is_c_loc(locale_t loc) {
	return __is_c_locale(__get_locale_lc_ctype(loc));
}

static bool is_utf8_loc(locale_t loc) {
	return __is_utf8_locale(__get_locale_lc_ctype(loc));
}

#ifndef NDEBUG
static bool is_1252_loc(locale_t loc) {
	return __is_1252_locale(__get_locale_lc_ctype(loc));
}
#endif


int isalnum_l(int c, locale_t loc) {
	return isdigit_l(c, loc) || isalpha_l(c, loc);
}

static bool isrange(int c, int a, int b) {
	return c>=a && c<=b;
}

int isalpha_l(int c, locale_t loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return (c>='a' && c<='z') || (c>='A' && c<='Z');
	else  {
		assert(is_1252_loc(loc));
		return isrange(c, 0x41, 0x5a) ||
			isrange(c, 0x61, 0x7a) ||
			isrange(c, 0x83, 0x83) ||
			isrange(c, 0x8a, 0x8a) ||
			isrange(c, 0x8c, 0x8c) ||
			isrange(c, 0x8e, 0x8e) ||
			isrange(c, 0x9a, 0x9a) ||
			isrange(c, 0x9c, 0x9c) ||
			isrange(c, 0x9e, 0x9f) ||
			isrange(c, 0xaa, 0xaa) ||
			isrange(c, 0xb5, 0xb5) ||
			isrange(c, 0xba, 0xba) ||
			isrange(c, 0xc0, 0xd6) ||
			isrange(c, 0xd8, 0xf6) ||
			isrange(c, 0xf8, 0xff);
	}

}

int isblank_l(int c, locale_t loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return c==0x20 || c==0x09;
	else  {
		assert(is_1252_loc(loc));
		return c==0x20 || c==0x09 || c==0xa0;
	}
}

int iscntrl_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return (c>=0x00 && c<=0x1F) || c==0x7F;
	else  {
		assert(is_1252_loc(loc));
		return isrange(c, 0, 0x1f) || c==0x7F || c==0x81 || c==0x8d || isrange(c, 0x8f, 0x90) || c==0x9d || c==0xad;
	}
}

int isdigit_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return c>='0' && c<='9';
	else  {
		assert(is_1252_loc(loc));
		return isrange(c, 0x30, 0x39) || c==0xb2 || c==0xb3 || c==0xb9;
	}
}

//includes letters, digits, punctuation marks, and symbols—basically, any character that visibly marks the terminal or display, excluding space.
int isgraph_l(int c, locale_t loc) {
	assert(c==EOF || c>=0 && c<=255);

	if (is_c_loc(loc) || is_utf8_loc(loc))
		return c >='!' && c <= '~';  //0x21 to 0x7E 
	else  {
		assert(is_1252_loc(loc));
		return isrange(c, 0x21, 0x7e) || isrange(c, 0x82, 0x87) || isrange(c, 0x89, 0x8c) || c==0x8e || 
			isrange(c, 0x91, 0x97) || isrange(c, 0x9a, 0x9c) || isrange(c, 0x9e, 0x9f) || isrange(c, 0xa1, 0xff) ;
	}
}

int islower_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return c>='a' && c<='z';
	else  {
		assert(is_1252_loc(loc));
		return isrange(c, 0x61, 0x7a) || isrange(c, 0x83, 0x83) || isrange(c, 0x9a, 0x9a) || isrange(c, 0x9c, 0x9c) || 
				 isrange(c, 0x9e, 0x9e) || isrange(c, 0xaa, 0xaa) || isrange(c, 0xb5, 0xb5) || isrange(c, 0xba, 0xba) || 
				 isrange(c, 0xdf, 0xf6) || isrange(c, 0xf8, 0xff) ;
	}
}

int isprint_l(int c, locale_t loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return isgraph_l(c, loc) || c==0x20;
	else  {
		assert(is_1252_loc(loc));
		return c==0x09 || isrange(c, 0x20, 0x7e) || isrange(c, 0x82, 0x87) || isrange(c, 0x89, 0x8c) || c==0x8e || isrange(c, 0x91, 0x97) ||
				isrange(c, 0x9a, 0x9c) || isrange(c, 0x9e, 0xff) ;
	}
}

//checks if the given character is any printable character except for space or alphanumeric characters.
int ispunct_l(int c, locale_t  loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return isrange(c, 0x21, 0x2f) || isrange(c, 0x3a, 0x40) || isrange(c, 0x5b, 0x60) || isrange(c, 0x7b, 0x7e);
	else  {
		assert(is_1252_loc(loc));
		return  isrange(c, 0x21, 0x2f) || isrange(c, 0x3a, 0x40) || isrange(c, 0x5b, 0x60) || isrange(c, 0x7b, 0x7e) ||
				isrange(c, 0x82, 0x82) || isrange(c, 0x84, 0x87) || isrange(c, 0x89, 0x89) || isrange(c, 0x8b, 0x8b) || isrange(c, 0x91, 0x97) || 
				isrange(c, 0x9b, 0x9b) || isrange(c, 0xa1, 0xbf) || isrange(c, 0xd7, 0xd7) || isrange(c, 0xf7, 0xf7)	;
	}
}

//In the POSIX locale, at a minimum, the <space>, <form-feed>, <newline>, <carriage-return>, <tab>, and <vertical-tab> shall be included.
int isspace_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return c==' ' || c=='\f' || c=='\n'  || c=='\r'  || c=='\t'  || c=='\v' ;
	else  {
		assert(is_1252_loc(loc));
		return c==' ' || c=='\f' || c=='\n'  || c=='\r'  || c=='\t'  || c=='\v' || c==0xa0;
	}
}

int isupper_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (is_c_loc(loc) || is_utf8_loc(loc))
		return c>='A' && c<='Z';
	else  {
		assert(is_1252_loc(loc));
		return isrange(c, 0x41, 0x5a) || isrange(c, 0x8a, 0x8a) || isrange(c, 0x8c, 0x8c) || isrange(c, 0x8e, 0x8e) || isrange(c, 0x9f, 0x9f) || isrange(c, 0xc0, 0xd6) || isrange(c, 0xd8, 0xde) ;
	}
}

int isxdigit_l(int c, locale_t  loc) {
	assert(c==EOF || c>=0 && c<=255);
	return isdigit_l(c, loc) || (c>='a' && c<='f') || ((c>='A' && c<='F'));
}

int tolower_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (c>='A' && c<='Z')
		return c-'A'+'a';
	else
		return c;
}

int toupper_l(int c, locale_t  __attribute__((__unused__)) loc) {
	assert(c==EOF || c>=0 && c<=255);
	if (c>='a' && c<='z')
		return c-'a'+'A';
	else
		return c;
}

static int ascii_unit_tests(void) {

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

int char_unit_test(void) {

	//!!!! TO DO -- add the comprehensive test cases i generated with gcc

	if (ascii_unit_tests()==0) return 0;
	
	// 0xAE is (r) symbol in 1252 only (not in "C" or UTF-8)
	if (ispunct(0xAE)) return 0;
	if (isalpha(0xAE)) return 0;
	if (isgraph(0xAE)) return 0;
	if (isdigit(0xAE)) return 0;

	setlocale(LC_ALL, "C");
	if (ascii_unit_tests()==0) return 0;
	if (ispunct(0xAE)) return 0;
	if (isalpha(0xAE)) return 0;
	if (isgraph(0xAE)) return 0;
	if (isdigit(0xAE)) return 0;

	setlocale(LC_ALL, "");   // default is UTF-8 encoding
	if (ascii_unit_tests()==0) return 0;
	if (ispunct(0xAE)) return 0;
	if (isalpha(0xAE)) return 0;
	if (isgraph(0xAE)) return 0;
	if (isdigit(0xAE)) return 0;

	setlocale(LC_ALL, ".1252");
	if (ascii_unit_tests()==0) return 0;
	if (!ispunct(0xAE)) return 0;
	if (isalpha(0xAE)) return 0;
	if (!isgraph(0xAE)) return 0;
	if (isdigit(0xAE)) return 0;

	setlocale(LC_ALL, "C");

	return 1;
}


