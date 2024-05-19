#include <stdio.h>
#include <string.h>
#include <locale.h>
#include <windows.h>

void print_ischar(char* name, int (*func)(int c));
void print_locales(char* name, int (*func)(int c));

int main() {
	char b[80];

	//SetConsoleOutputCP(1252);
	SetConsoleOutputCP(65001);   // utf-8 console

    char *locale = setlocale(LC_ALL, "C");


	strcpy(b, "\u20AC 1.23");
	printf("%s\n", b);  // €1.23

	printf("€1.23\n");  // €1.23

	strcpy(b, "x 1.23");
	printf("%s\n", b);  // (r)

	b[0]=0xAE;
	printf("%s\n", b);  // (r)

	b[0]=0x80;
	printf("%s\n", b);  // €1.23


    // Get the current locale for all categories
    locale = setlocale(LC_ALL, NULL);
    printf("Current locale: %s\n", locale);

    // Set the locale to the user's default environment settings
    setlocale(LC_ALL, "");
    // Get and print the new setting
    locale = setlocale(LC_ALL, NULL);
    printf("Locale after setting to default: %s\n", locale);

	strcpy(b, "\u20AC 1.23");
	printf("%s\n", b);  // €1.23

	printf("€1.23\n");  // €1.23

	strcpy(b, "x 1.23");
	printf("%s\n", b);  // (r)

	b[0]=0xAE;
	printf("%s\n", b);  // (r)

	b[0]=0x80;
	printf("%s\n", b);  // €1.23

//	printf("%x %d\n", '€', ispunct('€'));  //warning: multi-character character constant [-Wmultichar]
//	printf("%x %d\n", '€', isalpha('€'));
//	printf("%x %d\n", '€', isgraph('€'));
//	printf("%x %d\n\n", '€', isdigit('€'));

	printf("%d %d\n", 0x80, ispunct(0x80));
	printf("%d %d\n", 0x80, isalpha(0x80));
	printf("%d %d\n", 0x80, isgraph(0x80));
	printf("%d %d\n\n", 0x80, isdigit(0x80));

	printf("%d %d\n", 0xAE, ispunct(0xAE));
	printf("%d %d\n", 0xAE, isalpha(0xAE));
	printf("%d %d\n", 0xAE, isgraph(0xAE));
	printf("%d %d\n\n", 0xAE, isdigit(0xAE));

	print_locales("isascii",isascii);
	print_locales("isalnum",isalnum);
	print_locales("isalpha",isalpha);
	print_locales("isblank",isblank);
	print_locales("iscntrl",iscntrl);
	print_locales("isdigit",isdigit);
	print_locales("isgraph",isgraph);
	print_locales("islower",islower);
	print_locales("isprint",isprint);
	print_locales("ispunct",ispunct);
	print_locales("isspace",isspace);
	print_locales("isupper",isupper);
	print_locales("isxdigit",isxdigit);

// int toascii(int c);
// int tolower(int c);
// int toupper(int c);

   return 0;
}

void print_locales(char* name, int (*func)(int c) ) {
   printf("locale set to %s\n", setlocale(LC_ALL, "C"));
	print_ischar(name, func);

   //printf("locale set to %s\n", setlocale(LC_ALL, ".utf8"));
	//print_ischar(name, func);

   printf("locale set to %s\n", setlocale(LC_ALL, ".1252"));
	print_ischar(name, func);
}

void print_ischar(char* name, int (*func)(int c)) {
	int i,last,r;

	printf("%s\n", name);
	last=0;
	printf("ranges true (inclusive):\n");
	for (i=0; i<256;i++) { 
		r=func(i)?1:0;
		if (r) {
			if (last!=r) printf("0x%02x, ", i);
		}
		else {
			if (last!=r) printf("0x%02x\n", i-1);
		}
		last=r;
	}
	if (r) printf("0x%02x\n", i-1);
	printf("test array results:\n");
	printf("{");
	for (i=0; i<256;i++) { 
		printf("%d", func(i)?1:0);
		if (i!=255) printf(",");
	}
	printf("}\n\n");
}