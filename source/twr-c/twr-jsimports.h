#ifndef __TWR_JSIMPORTS_H__
#define __TWR_JSIMPORTS_H__

#include <time.h>
#include <twr-io.h>

/* WebAssembly.ModuleImports (Javascript/TypeScript functions callable by C code) */
/* these are not generally used directly by applications -- use the stdclib and twr_ functions */

#ifdef __cplusplus
extern "C" {
#endif


__attribute__((import_name("twrTimeTmLocal"))) void twrTimeTmLocal(struct tm*, const time_t);
__attribute__((import_name("twrUserLconv"))) void twrUserLconv(struct lconv *, int code_page);
__attribute__((import_name("twrUserLanguage"))) char* twrUserLanguage(void);
__attribute__((import_name("twrRegExpTest1252"))) int twrRegExpTest1252(char*, int c);
__attribute__((import_name("twrToLower1252"))) int twrToLower1252(int c);
__attribute__((import_name("twrToUpper1252"))) int twrToUpper1252(int c);
__attribute__((import_name("twrStrcoll"))) int twrStrcoll(const char*, const char*, int);
__attribute__((import_name("twrUnicodeCodePointToCodePage"))) int twrUnicodeCodePointToCodePage(char*,int cp, int code_page);
__attribute__((import_name("twrCodePageToUnicodeCodePoint"))) int twrCodePageToUnicodeCodePoint(int byte, int code_page);
__attribute__((import_name("twrGetDtnames"))) struct locale_dtnames* twrGetDtnames(int code_page);

__attribute__((import_name("twrFAbs"))) double twrFAbs(double arg);
__attribute__((import_name("twrACos"))) double twrACos(double arg);
__attribute__((import_name("twrASin"))) double twrASin(double arg);
__attribute__((import_name("twrATan"))) double twrATan(double arg);
__attribute__((import_name("twrATan2"))) double twrATan2(double y, double x);
__attribute__((import_name("twrCos"))) double twrCos(double rad);
__attribute__((import_name("twrSin"))) double twrSin(double rad);
__attribute__((import_name("twrTan"))) double twrTan(double rad);
__attribute__((import_name("twrExp"))) double twrExp(double arg);
__attribute__((import_name("twrFloor"))) double twrFloor(double arg);
__attribute__((import_name("twrCeil"))) double twrCeil(double arg);
__attribute__((import_name("twrFMod"))) double twrFMod(double x,double y);
__attribute__((import_name("twrLog"))) double twrLog(double arg);
__attribute__((import_name("twrPow"))) double twrPow(double base, double exponent);
__attribute__((import_name("twrSqrt"))) double twrSqrt(double arg);
__attribute__((import_name("twrTrunc"))) double twrTrunc(double arg);

__attribute__((import_name("twrAtod"))) double twrAtod(const char* str, int len);

// does not use locale information; it always uses . (a dot) as the decimal separator.
// twr_localize_numeric_string() is available to convert buffer if needed
__attribute__((import_name("twrDtoa"))) void twr_dtoa(char* buffer, int buffer_size, double value, int max_precision);

#ifdef __cplusplus
}
#endif

#endif  //__TWR_JSIMPORTS_H__





