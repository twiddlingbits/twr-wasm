#include "twr-crt.h"  // twr_utf32_to_code_page
#include "twr-jsimports.h"
#include <locale.h>  // __get_current_lc_ctype_code_page
#include <uchar.h>
#include <stdlib.h>  // Include stdlib.h for MB_CUR_MAX
#include <string.h>


void twr_utf32_to_code_page(char*out, int utf32) {
	const int len=twrUnicodeCodePointToCodePage(out, utf32, __get_current_lc_ctype_code_page());
	out[len]=0;  // add 0 terminator
}

// At most MB_CUR_MAX bytes can be written by this function. (i dont currently define MB_CUR_MAX, which is a <stdlib.h> MACRO)
// mbstate_t is not used because (a) no partial conversions are performed by c32rtomb, and we don't have multiple threads
// (mbstate_t can be used for thread safety)
size_t c32rtomb( char* s, char32_t c32, mbstate_t* ps ) {
	//If s is a null pointer, the call is equivalent to c32rtomb(buf, U'\0', ps) for some internal buffer buf.
	if (s==NULL) return 1;
	const int len=twrUnicodeCodePointToCodePage(s, c32, __get_current_lc_ctype_code_page());
	return len;
}

// c16rtomb does not handle Non-BMP Characters: Characters outside the BMP (U+10000 to U+10FFFF) are represented as surrogate pairs in UTF-16.
// but this function doesn't support surrogate pairs
size_t c16rtomb( char* s, char16_t c16, mbstate_t* ps ) {
	return c32rtomb(s, c16, ps);
}

//////////////////////////////////
// test cases

// Function to test c32rtomb
int test_c32rtomb(char32_t wc, const char *expected) {
    char mbstr[MB_CUR_MAX];
    mbstate_t state;
    memset(&state, 0, sizeof(mbstate_t)); // Initialize the conversion state

    // Perform the conversion
    size_t ret = c32rtomb(mbstr, wc, &state);
    
    // Check for conversion error
    if (ret == (size_t)-1) {
       return 0;
    }

    // Compare the result with the expected multibyte sequence
	 if (ret!=strlen(expected)) return 0;
    return memcmp(mbstr, expected, ret) == 0;
}

int test_c16rtomb(char16_t wc, const char *expected) {
	return test_c32rtomb(wc, expected);
}

int mbstring_unit_test() {
		// test_c32rtomb
		setlocale(LC_CTYPE, "");   // set UTF-8
		if (test_c32rtomb(U'€', "\xE2\x82\xAC")==0) return 0;  // Euro sign in UTF-8
		if (test_c32rtomb(U'😊', "\xF0\x9F\x98\x8A")==0) return 0;  // Smiling face emoji in UTF-8
		if (test_c32rtomb(U'A', "A")==0) return 0;  // ASCII character in UTF-8
		if (test_c32rtomb(U'あ', "\xE3\x81\x82")==0) return 0;  // Hiragana 'A' in UTF-8

		setlocale(LC_CTYPE, ".1252");   // windows-1252 encoding
		if (test_c32rtomb(U'€', "\x80")==0) return 0;  // Euro sign in 1252
		if (test_c32rtomb(U'A', "A") ==0)return 0;  // ASCII character in UTF-8

		// test_c16rtomb
		setlocale(LC_CTYPE, "");   // set UTF-8
		if (test_c16rtomb(u'€', "\xE2\x82\xAC")==0) return 0;  // Euro sign in UTF-8
		if (test_c16rtomb(u'A', "A")==0) return 0;  // ASCII character in UTF-8
		if (test_c16rtomb(u'あ', "\xE3\x81\x82")==0) return 0;  // Hiragana 'A' in UTF-8

		setlocale(LC_CTYPE, ".1252");   // windows-1252 encoding
		if (test_c16rtomb(u'€', "\x80")==0) return 0;  // Euro sign in 1252
		if (test_c16rtomb(u'A', "A")==0) return 0;  // ASCII character in UTF-8

		setlocale(LC_CTYPE, "C");   // return to default

		return 1;
}
