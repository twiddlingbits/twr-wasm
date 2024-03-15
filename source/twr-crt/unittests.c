#include "twr-crt.h"
#include <stdlib.h>

/********************************/
/********************************/
/********************************/

static int check(double a, double b) {
	uint64_t ai, bi;
	twr_memcpy(&ai, &a, 8);
	twr_memcpy(&bi, &b, 8);
	if (ai!=bi) 
		return 0;	

	return 1;
}

static int checkb(uint64_t ai, double b) {
	uint64_t bi;
	twr_memcpy(&bi, &b, 8);
	if (ai!=bi) 
		return 0;	

	return 1;
}

int twr_atof_unit_test() {
	
	if (twr_atof("1")!=1.0) return 0;
	if (!check(1, twr_atof("1"))) return 0;
	if (!check(0.55555555555555555555, twr_atof("0.55555555555555555555"))) return 0;	
	if (!check(1.999999999999999999, twr_atof("1.999999999999999999"))) return 0;	// mantissa all 1s
	if (twr_atof("1.999999999999999999")!=2.0) return 0;	// verify a rounding edge case
	if (!check(2.225074e-308, twr_atof("2.225074e-308"))) return 0;	
	// following tests a rounding edge case
	if (!check(2.2250738585072013e-308, twr_atof("2.2250738585072013e-308"))) return 0;	// mantissa all 1s with first de-normalized value
	if (twr_atof(" .1")!=.1) return 0;
	if (!check(.1, twr_atof(" .1"))) return 0;
	if (twr_atof("+1")!=1.0) return 0;
	if (twr_atof("+.1")!=.1) return 0;
	if (twr_atof("-1")!=-1) return 0;
	if (twr_atof("-.1")!=-.1) return 0;
	if (twr_atof("-1234.5678")!=-1234.5678) return 0;
	if (twr_atof("0.0")!= 0.0) return 0;
	if (twr_atof("0")!= 0) return 0;

#ifdef __wasm__
	if (!twr_isnan(twr_atof("junk"))) return 0;
#else
	if (twr_atof("junk")!= 0) return 0;
#endif

	if (twr_atof("-0x1afp-2")!= 0) return 0;
	if (twr_atof("  -0.0000000123junk")!=-0.0000000123) return 0;

   if (twr_atof("0.012")!= 0.012) return 0;
   if (!twr_isinf(twr_atof("inF"))) return 0;
   if (!twr_isnan(twr_atof("Nan"))) return 0;
   if (twr_atof("15e16")!= 15e16) return 0;
   if (twr_atof("15e-1")!= 1.5) return 0;
	if (!twr_isinf(twr_atof("1.0e+309"))) return 0;
	if (!twr_isinf(twr_atof("1.0e+330"))) return 0;
	if (!twr_isinf(twr_atof("3.2e+616"))) return 0;  /// ~3.2317e+616 is 2^2048
	if (!twr_isinf(twr_atof("3.3e+616"))) return 0;
	if (0.0!=twr_atof("1.0e-325")) return 0;
	if (0.0!=twr_atof("1.0e-345")) return 0;
   double a=twr_atof(".00000000000000000000000001");
	if (a!=1e-26) return 0;
	if (a!=(double)0.00000000000000000000000001) return 0;
	if (!check(123456789012345678901234567890.0, twr_atof("123456789012345678901234567890.0"))) return 0;
	if (!check(1.1125369292536006915451163586662e-308, twr_atof("1.1125369292536006915451163586662e-308"))) return 0;   /** this is 2pow(2,-1023) first denomralized number */
	if (!check(3.6e-310, twr_atof("3.6e-310"))) return 0;
	if (!check(0X1.FFFFFFFFFFFFFP+0, twr_atof("1.9999999999999998"))) return 0;
	if (!check(0X0.8000000000000P-1022, twr_atof("1.1125369292536007E-308"))) return 0; // first de-normalized value
	if (!check(0X0.0000000000008P-1022, twr_atof("4E-323"))) return 0; // small de-normalized value
	if (!check(0X0.0000000000004P-1022, twr_atof("2E-323"))) return 0; // small de-normalized value
	if (!check(0X0.0000000000002P-1022, twr_atof("1E-323"))) return 0; // small de-normalized value
	if (!check(0X0.0000000000001P-1022, twr_atof("5E-324"))) return 0; // last de-normalized value
	if (!checkb(0x39AA1F79C0000000, twr_atof("6.439804741657803e-031"))) return 0; // from www.ryanjuckett.com

	return 1;
}


/*******************************************************/
/*******************************************************/
/*******************************************************/


int twr_dtoa_unit_test() {
	char buffer[360];

	twr_dtoa(buffer, sizeof(buffer), 0.1, -1);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.00003, -1);
	if (twr_strcmp(buffer, "0.00003")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1234567890123456, -1);
	if (twr_strcmp(buffer, "1234567890123456")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 123456789.0123456, -1);
	if (twr_strcmp(buffer, "123456789.0123456")!=0) return 0;

#ifdef __wasm__
	twr_dtoa(buffer, sizeof(buffer), 0.0000003, -1);
	if (twr_strcmp(buffer, "3e-7")!=0) return 0;
#else
	twr_dtoa(buffer, sizeof(buffer), 0.000003, -1);
	if (twr_strcmp(buffer, "3E-6")!=0) return 0;
#endif

	twr_dtoa(buffer, sizeof(buffer), 123, -1);
	if (twr_strcmp(buffer, "123")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1000, -1);
	if (twr_strcmp(buffer, "1000")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.0003, -1);
	if (twr_strcmp(buffer, "0.0003")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 10.235, -1); 
	if (twr_strcmp(buffer, "10.235")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.0, -1);
	if (twr_strcmp(buffer, "0")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 10.23499965667724609375, -1);  // this is a float 32 example
	if (twr_strcmp(buffer, "10.234999656677246")!=0) return 0;
	
	double dv=twr_atof(" .1");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

	dv=twr_atof("10.235");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "10.235")!=0) return 0;

	dv=twr_atof("0.3");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_strcmp(buffer, "0.3")!=0) return 0;

// NOTE !!!!!
// wasm crt returns lower case E, original gcc tiny-wasm-runtime return uppercase E
	dv=twr_atof("3.3E123");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_stricmp(buffer, "3.3E+123")!=0) return 0;

	dv=twr_atof("0.1E-99");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_stricmp(buffer, "1E-100")!=0) return 0;

	dv=twr_atof("0.1234567E-99");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_stricmp(buffer, "1.234567E-100")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -0, -1);
	if (twr_strcmp(buffer, "0")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -1, -1);
	if (twr_strcmp(buffer, "-1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -0.1, -1);
	if (twr_strcmp(buffer, "-0.1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), -50.05, -1);
	if (twr_strcmp(buffer, "-50.05")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0.0988, -1);
	if (twr_strcmp(buffer, "0.0988")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 9.88e-300, -1);
	if (twr_stricmp(buffer, "9.88E-300")!=0) return 0;

	dv=twr_atof("-1.5E+50");
	twr_dtoa(buffer, sizeof(buffer), dv, -1);
	if (twr_stricmp(buffer, "-1.5E+50")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X1.FFFFFFFFFFFFFP+0, -1);  // mantissa all 1s
	if (twr_strcmp(buffer, "1.9999999999999998")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X1.0000000000000P+0, -1);  // mantissa almost all 0s
	if (twr_strcmp(buffer, "1")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.8000000000000P-1022, -1); // first de-normalized value
	if (twr_stricmp(buffer, "1.1125369292536007E-308")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000008P-1022, -1);  
	if (twr_stricmp(buffer, "4E-323")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000004P-1022, -1);  
	if (twr_stricmp(buffer, "2E-323")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000002P-1022, -1);  
	if (twr_stricmp(buffer, "1E-323")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 0X0.0000000000001P-1022, -1);  // mantissa 1, last denorm. value
	if (twr_stricmp(buffer, "5E-324")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 2.2250738585072013e-30, -1);  
	if (twr_stricmp(buffer, "2.2250738585072013E-30")!=0) return 0;

	// check precision

	twr_dtoa(buffer, sizeof(buffer), 0.1, 6);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;

//!!!! WHICH ONE IS RIGHT?
#ifdef __wasm__
	twr_dtoa(buffer, sizeof(buffer), 0.1f, 6);
	if (twr_strcmp(buffer, "0.100000")!=0) return 0;
#else
	twr_dtoa(buffer, sizeof(buffer), 0.1f, 6);
	if (twr_strcmp(buffer, "0.1")!=0) return 0;
#endif

	twr_dtoa(buffer, sizeof(buffer), 1.0/3.0, 6);
	if (twr_strcmp(buffer, "0.333333")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1000+1.0/3.0, 6);
	if (twr_strcmp(buffer, "1000.33")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 1000.5, 6);
	if (twr_strcmp(buffer, "1000.5")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 100000.5, 6);
	if (twr_strcmp(buffer, "100001")!=0) return 0;

	twr_dtoa(buffer, sizeof(buffer), 100000.33333, 6);
	if (twr_strcmp(buffer, "100000")!=0) return 0;
	
	return 1;
}

/*******************************************************/
/*******************************************************/
/*******************************************************/

int fcvt_expect(const char* buffer, int dec, int sign, int error, const char* rb,  int rd, int rs) {
	if (twr_strcmp(buffer, rb)!=0) return 0;
	if (dec!=rd) return 0;
	if (sign!=rs) return 0;
	if (error!=0) return 0;

	return 1;
}

int twr_fcvt_unit_test() {
	char buffer[360];
 	int dec, sign, error;

	error=_fcvt_s(buffer, sizeof(buffer), 1, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  1, 0)) return 0;

	error=_fcvt_s(buffer, sizeof(buffer), 0.5, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "5",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0.1, 2, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0.99999, 2, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "100",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), .000555555, 4, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "6",  -3, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 123.45, 3, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "123450",  3, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 1.04, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 1.06, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "11",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), -1.04, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "10",  1, 1)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), -1.06, 1, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "11",  1, 1)) return 0;	

	error=twr_fcvt_s(buffer, sizeof(buffer), -9.876, 3, &dec, &sign);
	if (!fcvt_expect(buffer, dec, sign, error, "9876",  1, 1)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(72057594037927936), 10, &dec, &sign);  //2^56
	if (!fcvt_expect(buffer, dec, sign, error, "720575940379279360000000000",  17, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(72057594037927937), 10, &dec, &sign);  //2^56+1
	if (!fcvt_expect(buffer, dec, sign, error, "720575940379279360000000000",  17, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(72057594037927936+16), 10, &dec, &sign);  //2^56+16
	if (!fcvt_expect(buffer, dec, sign, error, "720575940379279520000000000",  17, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)(0.1e-18), 30, &dec, &sign);  
	if (!fcvt_expect(buffer, dec, sign, error, "100000000000",  -18, 0)) return 0;
	
	error=twr_fcvt_s(buffer, sizeof(buffer), (double)6.54321e+200, 10, &dec, &sign);  
#ifdef __wasm__
	if (error==0) return 0;
#else
	if (!fcvt_expect(buffer, dec, sign, error, "6543209999999999561461578727841808536676238014554206487411164761511588201120188491102838911919793884914712609471921587675606823921054952492339799962922243734546177255394661967753070612297755130981253120000000000",  201, 0)) return 0;
#endif

	error=twr_fcvt_s(buffer, sizeof(buffer)/3, (double)6.54321e+200, 10, &dec, &sign);
	if (0==error ) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)1.23e-90, 93, &dec, &sign); 
	if (!fcvt_expect(buffer, dec, sign, error, "1230",  -89, 0)) return 0;  // not sure what correct behaviour for dec should be in this case

#ifdef __wasm__
	error=twr_fcvt_s(buffer, sizeof(buffer), (double)1.23e-20, 3, &dec, &sign); 
	if (!fcvt_expect(buffer, dec, sign, error, "",  -3, 0)) return 0;  // not sure what correct behaviour for dec should be in this case
#endif

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)0.0005, 2, &dec, &sign); 
#ifdef __wasm__
	if (!fcvt_expect(buffer, dec, sign, error, "",  -2, 0)) return 0;
#else
	if (!fcvt_expect(buffer, dec, sign, error, "",  -3, 0)) return 0;
#endif

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)6.54321e-200, 10, &dec, &sign); 
#ifdef __wasm__
	if (error==0) return 0;
#else
	if (!fcvt_expect(buffer, dec, sign, error, "",  -199, 0)) return 0;
#endif

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)6.54321e-200, 210, &dec, &sign); 
#ifdef __wasm__
	if (error==0) return 0;
#else
	if (!fcvt_expect(buffer, dec, sign, error, "65432100000",  -199, 0)) return 0;
#endif

	error=twr_fcvt_s(buffer, sizeof(buffer), (double)3.6e-310, 350, &dec, &sign); // un-normalized
#ifdef __wasm__
	if (error==0) return 0;
#else
	if (!fcvt_expect(buffer, dec, sign, error, "36000000000000087643837346930308760325595",  -309, 0)) return 0;
#endif

	error=twr_fcvt_s(buffer, sizeof(buffer), 0, 1, &dec, &sign);   // test zero (which is denormalized)
	if (!fcvt_expect(buffer, dec, sign, error, "0",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), 0, 2, &dec, &sign);   // test zero (which is denormalized)
	if (!fcvt_expect(buffer, dec, sign, error, "00",  0, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer), twr_nanval(), 20, &dec, &sign);   
	if (!fcvt_expect(buffer, dec, sign, error, "1#QNAN000000000000000",  1, 0)) return 0;

	error=twr_fcvt_s(buffer, sizeof(buffer),twr_infval(), 20, &dec, &sign);   
	if (!fcvt_expect(buffer, dec, sign, error, "1#INF0000000000000000",  1, 0)) return 0;

	return 1;
}


