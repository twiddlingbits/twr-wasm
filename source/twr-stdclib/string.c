#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <errno.h>
#include "twr-jsimports.h"
#include "twr-crt.h"

/* these are all ASCII (not locale specific) implementations */

size_t strlen(const char * str) {

	size_t k=0;

	if (str==NULL) return 0;

	while (str[k])
		k++;

	return k;
}

int twr_utf8_char_len(const char *str) {
	const unsigned char* mbstr=(const unsigned char*)str;
	if (mbstr==NULL || *mbstr==0) return 0;
	int len;
	if ((*mbstr & 0x80) == 0) {
			len=1;
	} else if ((*mbstr & 0xE0) == 0xC0) {
		len = 2;
	} else if ((*mbstr & 0xF0) == 0xE0) {
		len = 3;
	} else if ((*mbstr & 0xF8) == 0xF0) {
		len = 4;
	} else {
		len=1;
		assert(0);
	}

	return len;
}

size_t twr_mbslen_l(const char *str, locale_t locale) {
	const struct lconv* lcc = __get_lconv_lc_ctype(locale);
	if (__is_utf8_locale(lcc)) {
		size_t k=0, len=0;

		if (str==NULL) return 0;

		while (str[k])  {
			len++;
			k=k+twr_utf8_char_len(str+k);
		}

		return len;
	}
	else {
		return strlen(str);
	}
}

char *strdup(const char * source) {
	if (source==NULL) return NULL;
	char * copy = (char *) malloc( strlen(source) + 1 ); 
	if (copy)
		strcpy( copy, source );
	
	return copy;
}

char *strcpy(char *dest, const char *source) {
	size_t k=0;

	if (dest==NULL || source==NULL) return NULL;

	do {
		dest[k]=source[k];
	} while (source[k++]);

	return dest;
}

int strcat_s(char *dest, size_t destsz, const char *src) {
	if (dest==NULL || src==NULL) return 1;

	size_t destlen=strlen(dest);
	size_t srclen=strlen(src);
	if (destlen+srclen+1>destsz) return 1;

	strcpy(dest+destlen, src);

	return 0;
}

char* strcat(char *dest, const char *src) {
	char *save = dest;

	while(*dest) dest++;
	while ((*dest++ = *src++));
	return save;
}

char *strncpy(char *dest, const char *source, size_t count) {
	size_t k=0;

	if (dest==NULL || source==NULL) return NULL;

	do {
		dest[k]=source[k];
	} while (source[k++] && k<count);

	while (k<count) 
		dest[k++]=0;

	return dest;
}

int strncmp(const char* lhs, const char* rhs, size_t count) {

	const int32_t* pl=(int32_t*)lhs;
	const int32_t* pr=(int32_t*)rhs;

	if (*pl==TWR_STRXFRM_MARKER || *pr==TWR_STRXFRM_MARKER) {
		assert(*pl==*pr);  // if either string has been transformed by strxfrm, then both should be
		locale_t loc=(locale_t)(lhs+4);  // assume left and right locale_t are the same
		return strcoll_l(lhs+4+sizeof(struct __locale_t_struct), rhs+4+sizeof(struct __locale_t_struct), loc);
	}

	size_t k=0;

	while (1) {
		int c1=lhs[k];
		int c2=rhs[k];

		if (c1<c2) return -1;
		else if (c1>c2) return 1;
		else if (c1==0 && c2==0) return 0;
		k++;
		if (k==count) return 0;
	}	
}

int strcmp(const char* string1, const char* string2) {
	return strncmp(string1, string2, MAX_SIZE_T);
}

int strnicmp(const char* string1, const char* string2, size_t count ) {
	size_t k=0;

	while (1) {
		int c1=tolower(string1[k]);
		int c2=tolower(string2[k]);

		if (c1<c2) return -1;
		else if (c1>c2) return 1;
		else if (c1==0 && c2==0) return 0;
		k++;
		if (k==count) return 0;
	}
}

int stricmp(const char* string1, const char* string2) {
	return strnicmp(string1, string2, MAX_SIZE_T);
}

char *strstr(const char *haystack, const char *needle) {
	int k=0;
	int len=strlen(needle);

	while (haystack[k]) {
		if (strncmp(haystack+k, needle, len)==0)
			return (char*)(haystack+k);
		k++;
	}

	return NULL;
}

int strcoll_l(const char* lhs, const char* rhs, locale_t loc) {
	struct lconv* lcc = __get_lconv_lc_collate(loc);
	if (__is_c_locale(lcc))  
		return strcmp(lhs, rhs);
	else
		return twrStrcoll(lhs, rhs, __get_code_page(lcc));
}

//Compares two null-terminated byte strings according to the current locale as defined by the LC_COLLATE category.
int strcoll(const char* lhs, const char* rhs) {
	return strcoll_l(lhs, rhs, twr_get_current_locale());
}

/** reverse a string */
void twr_strhorizflip(char * buffer, int n) {
	for (int k=0; k<n/2;k++)  {
		char t=buffer[k];
		buffer[k]=buffer[n-k-1];
		buffer[n-k-1]=t;
	}
}

size_t strxfrm_l(char *dest, const char *source, size_t count, locale_t locale) {
	const int offset=4+sizeof(struct __locale_t_struct);
	if (dest) {
		int32_t * p = (int32_t *)dest;
		p[0]=TWR_STRXFRM_MARKER;
		memcpy(&p[1], locale, sizeof(struct __locale_t_struct));
		assert(count-offset>0);
		strncpy(dest+offset, source, count-offset);
	}

	return strlen(source)+offset;
}

size_t strxfrm(char *dest, const char *source, size_t count) {
	return strxfrm_l(dest, source, count, twr_get_current_locale());
}

char *strchr(const char *str, int ch) {
	const char c=ch;
	while (1) {
		if (*str == c)
			return (char *)str;
		if (*str == 0)
			return NULL;
		str++;
	}
}

void *memchr(const void *ptr, int ch, size_t count) {
	const unsigned char c=ch;
	const unsigned char* cptr=ptr;
	while (count--) {
		if (*cptr == c)
			return (void *)cptr;
		cptr++;
	}

	return NULL;
}

// memeset() uses the .wat code in twr-wasm-c
// memcpy() uses the .wat code in twr-wasm-c

void *memmove(void *dest, const void *src, size_t n)
{
	uint8_t* from = (uint8_t*)src;
	uint8_t* to = (uint8_t*)dest;

	if (from == to || n == 0)
		return dest;

	else if (to > from && to-from < (int)n) {
		/* to overlaps with from */
		/*  <from......>         */
		/*         <to........>  */
		/* copy in reverse, to avoid overwriting from */
		int i;
		for(i=n-1; i>=0; i--)
			to[i] = from[i];
		return dest;
	}
	else if (from > to && from-to < (int)n) {
		/* to overlaps with from */
		/*        <from......>   */
		/*  <to........>         */
		/* copy forwards, to avoid overwriting from */
		size_t i;
		for(i=0; i<n; i++)
			to[i] = from[i];
		return dest;
	}
	else {
		memcpy(dest, src, n);
		return dest;
	}
}

// Negative value if lhs appears before rhs in lexicographical order.
// Zero if lhs and rhs compare equal, or if count is zero.
// Positive value if lhs appears after rhs in lexicographical order.
int memcmp( const void* lhs, const void* rhs, size_t count ) {
	const unsigned char* l=lhs;
	const unsigned char* r=rhs;
	size_t k=0;

	while (1) {
		if (k==count) return 0;

		unsigned char c1=l[k];
		unsigned char c2=r[k];

		if (c1<c2) return -1;
		else if (c1>c2) return 1;
		k++;
	}	
}

int string_unit_test() {
	if (strcmp("a","a")!=0) return 0;
	if (strcmp("aaa","aaz")>=0) return 0;
	if (strcmp("aaz","aaa")<=0) return 0;

	if (stricmp("a","A")!=0) return 0;
	if (strcmp("aaa","aaz")>=0) return 0;
	if (stricmp("aA2","aa1")<=0) return 0;

	if (strlen("123")!=3) return 0;

	if (strcmp("this is a test string", strdup("this is a test string"))!=0) return 0;

	if (strncmp("abc123zu5", "abc", 3)!=0) return 0;
	if (strncmp("123",strstr("abc123zu5", "123"),3)!=0) return 0;

	if (strnicmp("abc123zu5", "aBc", 3)!=0) return 0;
	if (strnicmp("123",strstr("abc123zu5", "123"),3)!=0) return 0;

	if (memcmp("abc","abd", 2)!=0) return 0;
	if (memcmp("abc","abd", 3)!=-1) return 0;
	if (memcmp("abd","abc", 3)!=1) return 0;

	char dest[16];
	const char *src="1234";

	const char*r=strncpy(dest, src, 10);
	if (strlen(r)!=strlen(src)) return 0;
	if (strcmp(r, src)!=0) return 0;

	memcpy(dest, "321", 4);
	if (dest[3]!=0) return 0;
	if (strcmp(dest, "321")!=0) return 0;

	//  errno.c
	if (strcmp(strerror(0), "No error")!=0) return 0;
	if (strcmp(strerror(999999), "Unknown error code")!=0) return 0;
	if (strcmp(strerror(ESRCH), "No such process")!=0) return 0;
	_set_errno(EBADF);
	if (strcmp(_strerror("Hi"), "Hi: Bad file number")!=0) return 0;
	if (strcmp(_strerror(NULL), "Bad file number")!=0) return 0;
	errno=ENOENT;
	if (errno!=ENOENT) return 0;
	if (strcmp(_strerror("xxx"), "xxx: No such file or directory")!=0) return 0;

	char* x="123";
	if (strchr(x,'2')!=(x+1)) return 0;
	if (strchr(x,'A')!=0) return 0;
	x="";
	if (strchr(x,0)!=(x)) return 0;

	x="ABCDEF";
	if (memchr(x,'A',0)!=0) return 0;
	if (memchr(x,'A',6)!=(x+0)) return 0;
	if (memchr(x,'C',6)!=(x+2)) return 0;
	if (memchr(x,'F',6)!=(x+5)) return 0;
	if (memchr(x,'c',6)!=0) return 0;

	if (twr_mbslen_l(x, twr_get_current_locale())!=6) return 0;
	if (twr_mbslen_l(NULL, twr_get_current_locale())!=0) return 0;
	if (twr_mbslen_l("", twr_get_current_locale())!=0) return 0;


	locale_t loc=newlocale(LC_ALL_MASK, "", (locale_t)0);
	// c strcmp(): A positive integer if str1 is greater than str2.
	if (strcoll_l("äpfel", "apfel", loc)!=1) return 0;
	if (strcmp("äpfel", "apfel")!=1) return 0;
	if (strcoll_l("€ 100", "A 100", loc)!=-1) return 0; 
	if (strcmp("€ 100", "A 100")!=1) return 0;

	if (twr_mbslen_l(NULL, twr_get_current_locale())!=0) return 0;
	if (twr_mbslen_l("", twr_get_current_locale())!=0) return 0;
	if (twr_mbslen_l("1", loc)!=1) return 0;
	if (twr_mbslen_l("äpfel", loc)!=5) return 0;
	if (twr_utf8_char_len("1")!=1) return 0;
	if (twr_utf8_char_len("ü")!=2) return 0;
	if (twr_utf8_char_len("あ")!=3) return 0;
	if (twr_utf8_char_len("𐍈")!=4) return 0;
	if (twr_mbslen_l("a𐍈bあ", loc)!=4) return 0;
	
	freelocale(loc);

	loc=newlocale(LC_ALL_MASK, ".1252", (locale_t)0);
	if (strcoll_l("\x80 100", "A 100", loc)!=-1) return 0; // 0x80 = Euro in windows-1252 encoding
	if (strcmp("\x80 100", "A 100")!=1) return 0;
	if (strcoll_l("\x80 100", "\xA1 100", loc)!=1) return 0; // 0xA1 = Inverted !
	if (strcmp("\x80 100", "\xA1 100")!=-1) return 0;  
	freelocale(loc);

	setlocale(LC_ALL, "");

	if (strxfrm(NULL, "abcd", 0)!=4+sizeof(struct __locale_t_struct)+4) return 0;
	if (strxfrm(NULL, "äpfel", 0)!=4+sizeof(struct __locale_t_struct)+6) return 0;

	int buflen=4+sizeof(struct __locale_t_struct)+16;
	char lhs[buflen], rhs[buflen];
	strxfrm(lhs, "äpfel", buflen);
	strxfrm(rhs, "apfel", buflen);
	if (strcmp(lhs, rhs)!=1) return 0;

	strxfrm(lhs, "€ 100", buflen);
	strxfrm(rhs, "A 100", buflen);
	if (strcmp(lhs, rhs)!=-1) return 0;

	strxfrm(lhs, "1234", buflen);
	strxfrm(rhs, "1234", buflen);
	if (strcmp(lhs, rhs)!=0) return 0;

	setlocale(LC_ALL, "C");

	return 1;
}


