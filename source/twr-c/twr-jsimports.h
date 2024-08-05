#ifndef __TWR_JSIMPORTS_H__
#define __TWR_JSIMPORTS_H__

#include <time.h>
#include "twr-draw2d.h"
#include <twr-io.h>

/* WebAssembly.ModuleImports (Javascript/TypeScript functions callable by C code) */
/* these are not generally used directly by applications -- use the stdclib and twr_ functions */

#ifdef __cplusplus
extern "C" {
#endif


__attribute__((import_name("twrConCharOut"))) void twrConCharOut(int jsid, int c, int code_page);   
__attribute__((import_name("twrConPutStr"))) void twrConPutStr(int jsid, const char * str, int code_page);   
__attribute__((import_name("twrConCharIn"))) int twrConCharIn(int jsid);
__attribute__((import_name("twrConGetProp"))) int twrConGetProp(int jsid, const char* prop_name);
__attribute__((import_name("twrConCls"))) void twrConCls(int jsid);
__attribute__((import_name("twrConSetC32"))) void twrConSetC32(int jsid, int location, int c32);
__attribute__((import_name("twrConSetReset"))) void twrConSetReset(int jsid, int x, int y, bool isset);
__attribute__((import_name("twrConPoint"))) int twrConPoint(int jsid, int x, int y);
__attribute__((import_name("twrConSetCursor"))) void twrConSetCursor(int jsid, int position);
__attribute__((import_name("twrConSetColors"))) void twrConSetColors(int jsid, unsigned long foreground, unsigned long background);
__attribute__((import_name("twrConSetRange"))) void twrConSetRange(int jsid, int * chars, int start, int len);
__attribute__((import_name("twrConDrawSeq"))) void twrConDrawSeq(int jsid, struct d2d_draw_seq *);
__attribute__((import_name("twrSetFocus"))) void twrSetFocus(int jsid);
__attribute__((import_name("twrGetConIDFromName"))) int twrGetConIDFromName(const char* name);


__attribute__((import_name("twrSleep"))) void twrSleep(int ms);
__attribute__((import_name("twrTimeEpoch"))) double twrTimeEpoch(); 
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
__attribute__((import_name("twrToFixed"))) double twrToFixed(char* buffer, int buffer_size, double value, int dec_digits);
__attribute__((import_name("twrToExponential"))) void twrToExponential(char* buffer, int buffer_size, double value, int dec_digits);

__attribute__((import_name("twrDtoa"))) void twrDtoa(char* buffer, int buffer_size, double value, int max_precision);
__attribute__((import_name("twrFcvtS"))) int twrFcvtS(
   char* buffer,
   unsigned long sizeInBytes,  //size_t 
   double value,
   int fracpart_numdigits,
   int *dec,
   int *sign
);

#ifdef __cplusplus
}
#endif

#endif  //__TWR_JSIMPORTS_H__





