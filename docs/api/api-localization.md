# Locale Support

## Character encodings
Tiny-wasm-runtime locales supports ASCII, UTF-8 or windows-1252 encoding.  UTF-16/32 are not supported as a locale setting, but functions are provided to convert utf-32 (unicode code points) to and from ASCII, UTF-8, and windows-1252 "code pages".

UTF-8 uses between one to four bytes to represent any unicode character, with ASCII compatibility in the first 128 bytes.  It is also the standard for the web, and the default for clang.   But because it uses a variable number of bytes per character it can make string manipulation in C a bit harder than ASCII.

Windows-1252 is the default on most Windows computers in many countries - particularly the Americas and western Europe.  It is an extension of ASCII that uses a single byte per character.  This makes it easier than UTF-8 from a programmers perspective, but it doesn't represent as many characters.   It is provided to make it easier to port legacy C code, windows code,  as well as a simpler alternative to UTF-8.

Although the locale settings don't support utf-32 directly, you can use int arrays (instead of byte arrays) to hold utf-32 strings, and then convert them to/from utf-8 with the help of the provided two functions for this purpose.  

Alternately, you can use the libc++ utf-32 string functionality.

## Locales

### "C" 
"C" is the default locale, as usual.  When "C" is selected, the functions operate as usual. One subtly is that console i/o functions (such as `printf`) will generally function as expected with UTF-8, since the `div` and `window` consoles correctly handle UTF-8 character encoding.  This is normal on some OSs, such as linux, but not the default on Windows (which often defaults to windows-1252 for backward compatibility).

 `isgraph` style functions will only recognize ASCII characters, as is normal.   Functions such as `strcmp` operate on the byte sequence, which will typically results in UTF-8 codes being compared lexically. `strcoll` will use lexical ordering.

### "POSIX"
"POSIX" is the same as "C"
  
### ""
"" is the locale to specify the users default setting (this selects the setting used by the browser).  This will also enable UTF-8 in functions such as `strcoll`.  For example, if your browser is set to "en-US" as its default locale, `setlocale(LC_ALL, "")` will return `en-US.UTF-8`.  

`isgraph` style functions will still only recognize ASCII characters (since UTF-8 doesn't encode any single bytes greater than 127).  `strcoll`  uses locale specific ordering, and `printf` will use locale specific decimal points.  `strcmp` still compares two strings lexicographically (byte-by-byte) without considering locale-specific rules, per the spec. 

### ".UTF-8" 
".UTF-8" is the same as "" with tiny-wasm-runtime.

### ".1252"
".1252" will select the current default locale, but use windows-1252 character encoding (instead of UTF-8). Windows-1252 is a super set of ISO-8859-1 and is the most commonly used encoding for many european languages when unicode is not used.  This mode is primarily for legacy software, backwards compatibly, and windows compatibility.   

**1252 String Literals**

These days text editors generally default to UTF-8.  In order to use windows-1252  source code and/or string literals, such as `const char * str="€100"` you may need to: 

   - Configure your text editor to save in Windows-1252/ISO-8859-1 format (instead of UTF-8)
   - use compiler flags like `--finput-charset` and `-fexec-charset`
  
  By default, the Microsoft Visual Studio C compiler (MSVC) does not treat string literals as UTF-8. Instead, it treats them as being encoded in the current code page of the system, which is typically Windows-1252 on western european language Windows systems.  tiny-wasm-runtime is designed to work with clang, which does default to utf-8, so if you are compiling code written for MSVC, and you use extend character sets (non ASCII), you may need to adjust your compiler settings with the flags mentioned above.

### Others
Setting arbitrary locales, such as "fr-FR" when the browser is defaulted to another locale, is not supported.  

### Select the default locale
To select the users default locale with C, use a call like this:

~~~
setlocale(LC_ALL, "")
~~~

## libc++
If you are using C++, libc++ locale functions work as expected.

## C functions
The normal standard C library locale support is available, along with some POSIX extensions.   In addition, some tiny-wasm-runtime specific functions are documented in [C API](../api/api-c-general.md) (such as `twr_get_current_locale`,`twr_gets`, `twr_utf8_char_len`, `twr_mbslen_l`, `twr_utf32_to_code_page`, `twr_code_page_to_utf32_streamed`, `twr_get_navlang`, `twr_localize_numeric_string` )

Note that  `getchar()`, `io_getc()`, `getc(stdin)`, `fgetc(stdin)`, all do the essentially the same thing, and all return a unicode 32 bit code point.  They do not look at the current locale.  

For a locale aware character input, use `io_getc_l()`, `twr_gets()`, or `io_gets()`. All use the locale category LC_CTYPE.  See [C API](../api/api-c-general.md).

Note that in the "C" locale functions that get character(s) from stdin, like `twr_gets()`, behave different than functions that output characters to stdout (like  `puts`, `io_putstr`, `io_putc`, `putchar`).  Characters to stdout in "C" locale will handle UTF-8 characters.  For stdin, "C" uses ASCII.  All use the locale category LC_CTYPE.

For consistent UTF-8 (or windows-1252) behavior, set the locale as discussed above.

The primary standard C library functions are:
~~~
char* setlocale(int category, const char* locale);
struct lconv *localeconv(void);
~~~

As well as the all the standard library functions above, appropriate functions take into account the current locale (printf, strcoll, etc).

These are the extended POSIX style functions provided:

~~~
locale_t newlocale(int category_mask, const char *locale, locale_t base);
locale_t uselocale(locale_t);
void freelocale(locale_t);
locale_t duplocale(locale_t);

int isalnum_l(int c, locale_t loc);
int isalpha_l(int c, locale_t loc);
int isblank_l(int c, locale_t loc);
int iscntrl_l(int c, locale_t loc);
int isdigit_l(int c, locale_t loc);
int isgraph_l(int c, locale_t loc);
int islower_l(int c, locale_t loc);
int isprint_l(int c, locale_t loc);
int ispunct_l(int c, locale_t loc);
int isspace_l(int c, locale_t loc);
int isupper_l(int c, locale_t loc);
int isxdigit_l(int c, locale_t loc);
int tolower_l(int c, locale_t loc);
int toupper_l(int c, locale_t loc);

long long strtoll_l(const char *str, char **str_end, int base,  locale_t loc);
unsigned long long strtoull_l(const char *str, char **str_end,  int base, locale_t loc);
float strtof_l(const char *str, char ** str_end, locale_t locale);
double strtod_l(const char *str, char **str_end, locale_t locale);
long double strtold_l(const char *str, char **str_end, locale_t locale);

int strcoll_l(const char* lhs, const char* rhs,  locale_t loc);
size_t strxfrm_l(char *dest, const char *source, size_t count, locale_t locale);

size_t strftime_l(char *s, size_t maxsize, const char *format, const struct tm *timeptr, locale_t locale);

~~~






