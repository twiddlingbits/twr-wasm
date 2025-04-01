---
title: Localization Reference for twr-wasm
description: Wasm versions of standard C locale, libc++ locale and unicode functions are provided by twr-wasm.  ASCII, UTF-8 and windows-1252 encoding is supported.
---

# Localization Reference for twr-wasm
This section details twr-wasm's WebAssembly localization support.

Also see [Introduction to Character Encoding Support with twr-wasm](../gettingstarted/charencoding.md)

### Using C:
Standard C locale functions are supported by twr-wasm.  ASCII, UTF-8 and windows-1252 encoding is supported by the twr-wasm standard C library locale.  twr-wasm also includes C functions for UTF-32 support.

### Using C++:
- libc++ locale and unicode functions are supported by twr-wasm.
- libc++ unicode support includes utf-16 and utf-32 strings.

## Character Encodings
twr-wasm C locales support ASCII, UTF-8 or windows-1252 encoding.  UTF-16/32 are not supported as a std c lib locale setting, but functions are provided to convert utf-32 (unicode code points) to and from ASCII, UTF-8, and windows-1252 "code pages" (there are other miscellaneous utf-32 based functions as well.)

## Locales (Standard C Library)

### "C" 
"C" is the default locale, as usual.  When "C" is selected, the functions operate as usual. One subtly is that console i/o functions (such as `printf`) will generally function as expected with UTF-8, since the `div` and `window` consoles correctly handle UTF-8 character encoding.  This is normal on some OSs, such as linux, but not the default on Windows (which often defaults to windows-1252 for backward compatibility).

 `isgraph` style functions will only recognize ASCII characters, as is normal.   Functions such as `strcmp` operate on the byte sequence, which will typically results in UTF-8 codes being compared lexically. `strcoll` will use lexical ordering.

### "POSIX"
"POSIX" is the same as "C"
  
### ""
"" is the locale to specify the users default setting (this selects the setting used by the browser).  This will also enable UTF-8 in functions such as `strcoll`.  For example, if your browser is set to "en-US" as its default locale, `setlocale(LC_ALL, "")` will return `en-US.UTF-8`.  

`isgraph` style functions will still only recognize ASCII characters (since UTF-8 doesn't encode any single bytes greater than 127).  `strcoll`  uses locale specific ordering, and `printf` will use locale specific decimal points.  `strcmp` still compares two strings lexicographically (byte-by-byte) without considering locale-specific rules, per the spec. 

### ".UTF-8" 
".UTF-8" is the same as "" with twr-wasm.

### ".1252"
".1252" will select the current default locale, but use windows-1252 character encoding (instead of UTF-8). Windows-1252 is a super set of ISO-8859-1 and is the most commonly used encoding for many european languages when unicode is not used.  This mode is primarily for legacy software, backwards compatibly, and windows compatibility.   

### Others
Setting arbitrary locales, such as "fr-FR" when the browser is defaulted to another locale, is not supported.  

### Select the default locale
To select the user's browser's default locale using the C language, and enable consistent utf-8 support, use a call like this:

~~~
setlocale(LC_ALL, "")
~~~

## C and libc++ functions
If you are using twr-wasm's build of libc++, libc++ locale and unicode functions work as normal.

The usual standard C library locale support is available, along with some POSIX extensions.   In addition, some locale useful twr-wasm specific functions are documented in [C API](../api/api-c-general.md), such as `twr_get_current_locale`,`twr_mbgets`, `twr_getc32`, `twr_utf8_char_len`, `twr_mbslen_l`, `twr_utf32_to_code_page`, `twr_code_page_to_utf32_streamed`, `twr_get_navlang`, `twr_localize_numeric_string`.

Note that `io_getc32`, `getc(stdin)`, `fgetc(stdin)` do not look at the current locale.  `io_getc32` returns a 32 bit unicode code point, and `getc`/`fgetc` return extended ASCII. 

For a locale aware character input, use `io_mbgetc()` or `twr_mbgets()`. Both use the locale category LC_CTYPE.  See [C API](../api/api-c-general.md).

Note that when the locale is not set (or whenever the "C" locale is set) functions that get character(s) from stdin that are locale aware, like `twr_mbgets()`, behave different than functions that output characters to stdout (like  `puts`, `io_putstr`, `io_putc`, `putchar`).  Characters to stdout in "C" locale will handle UTF-8 characters.  For stdin, "C" locale uses ASCII.

For consistent UTF-8 (or windows-1252) behavior, set the locale as discussed above ( use `setlocale` )

The primary standard C library locale functions are:
~~~
char* setlocale(int category, const char* locale);
struct lconv *localeconv(void);
~~~

As well as the two standard library functions above, appropriate functions take into account the current locale (printf, strcoll, etc).

Note that `setlocale` returns a string using BCP 47 format (like a web browser).  Locale strings look like "en-US.UTF-8", instead of "en_US.UTF-8".
A dash, not an underscore, is used as a separator.

**POSIX functions**
These are the extended POSIX style functions provided that are related to locale:

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

size_t strftime_l(char *s, size_t maxsize, const char *format, const struct tm *timeptr, locale_t locale);

~~~

