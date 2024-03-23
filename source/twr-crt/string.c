#include <stddef.h>
#include "twr-crt.h"

/* these are all ASCII (not local specific) implementations */

twr_size_t twr_strlen(const char * str) {

	twr_size_t k=0;

	if (str==NULL) return 0;

	while (str[k])
		k++;

	return k;
}

char *twr_strdup(const char * source) {
	if (source==NULL) return NULL;
	char * copy = (char *) twr_malloc( twr_strlen(source) + 1 ); 
	if (copy)
		twr_strcpy( copy, source );
	
	return copy;
}

char *twr_strcpy(char *dest, const char *source) {
	twr_size_t k=0;

	if (dest==NULL || source==NULL) return NULL;

	do {
		dest[k]=source[k];
	} while (source[k++]);

	return dest;
}

int twr_strcat_s(char *dest, twr_size_t destsz, const char *src) {
	if (dest==NULL || src==NULL) return 1;

	twr_size_t destlen=twr_strlen(dest);
	twr_size_t srclen=twr_strlen(src);
	if (destlen+srclen+1>destsz) return 1;

	twr_strcpy(dest+destlen, src);

	return 0;
}

char *twr_strncpy(char *dest, const char *source, twr_size_t count) {
	twr_size_t k=0;

	if (dest==NULL || source==NULL) return NULL;

	do {
		dest[k]=source[k];
	} while (source[k++] && k<count);

	while (k<count) 
		dest[k++]=0;

	return dest;
}

int twr_strncmp(const char* lhs, const char* rhs, twr_size_t count) {
	twr_size_t k=0;

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

int twr_strcmp(const char* string1, const char* string2) {
	return twr_strncmp(string1, string2, TWR_MAX_SIZE_T);
}

int twr_strnicmp(const char* string1, const char* string2, twr_size_t count ) {
	twr_size_t k=0;

	while (1) {
		int c1=twr_tolower(string1[k]);
		int c2=twr_tolower(string2[k]);

		if (c1< c2) return -1;
		else if (c1>c2) return 1;
		else if (c1==0 && c2==0) return 0;
		k++;
		if (k==count) return 0;
	}
}

int twr_stricmp(const char* string1, const char* string2) {
	return twr_strnicmp(string1, string2, TWR_MAX_SIZE_T);
}

char *twr_strstr(const char *haystack, const char *needle) {
	int k=0;
	int len=twr_strlen(needle);

	while (haystack[k]) {
		if (twr_strncmp(haystack+k, needle, len)==0)
			return (char*)(haystack+k);
		k++;
	}

	return NULL;
}

/** reverse a string */
void twr_strhorizflip(char * buffer, int n) {
	for (int k=0; k<n/2;k++)  {
		char t=buffer[k];
		buffer[k]=buffer[n-k-1];
		buffer[n-k-1]=t;
	}
}

void *twr_memset(void *mem, int c, twr_size_t n) {
	unsigned char *str=(unsigned char *)mem;
	if (str) {
		for (volatile int k=0; k < n; k++)  // volatile so compiler doesn't optimize into memset call.
			str[k]=c;
	}
	return mem;
}

void *twr_memcpy(void *dest, const void * src, twr_size_t n) {
	while (n--)
		((unsigned char*)dest)[n]=((unsigned char*)src)[n];

	return dest;
}

int twr_string_unit_test() {
	if (twr_strcmp("a","a")!=0) return 0;
	if (twr_strcmp("aaa","aaz")>=0) return 0;
	if (twr_strcmp("aaz","aaa")<=0) return 0;

	if (twr_stricmp("a","A")!=0) return 0;
	if (twr_strcmp("aaa","aaz")>=0) return 0;
	if (twr_stricmp("aA2","aa1")<=0) return 0;

	if (twr_strlen("123")!=3) return 0;

	if (twr_strcmp("this is a test string", twr_strdup("this is a test string"))!=0) return 0;

	if (twr_strncmp("abc123zu5", "abc", 3)!=0) return 0;
	if (twr_strncmp("123",twr_strstr("abc123zu5", "123"),3)!=0) return 0;

	if (twr_strnicmp("abc123zu5", "aBc", 3)!=0) return 0;
	if (twr_strnicmp("123",twr_strstr("abc123zu5", "123"),3)!=0) return 0;

	char dest[10];
	const char *src="1234";

	const char*r=twr_strncpy(dest, src, 10);
	if (twr_strlen(r)!=twr_strlen(src)) return 0;
	if (twr_strcmp(r, src)!=0) return 0;

	twr_memcpy(dest, "321", 4);
	if (dest[3]!=0) return 0;
	if (twr_strcmp(dest, "321")!=0) return 0;

	return 1;
}


