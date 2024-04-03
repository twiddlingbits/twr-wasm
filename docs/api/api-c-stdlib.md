# Standard C library
The following subset of the standard C library is available.

 The source for these use the "twr_" function prefix (for example, twr_printf).  These also have standard C runtime names defined (for example, printf is defined in the usual stdio.h).  

The subset of implemented standard c lib functions can be found in the `tiny-wasm-runtime/include` folder.

## stdio.h
~~~
#define snprintf(x,y, ...) twr_snprintf(x,y, __VA_ARGS__)
#define printf(...) twr_printf(__VA_ARGS__)
~~~

## stdlib.h
~~~
#define malloc(x) twr_malloc(x)
#define free(x) twr_free(x)
#define avail(x) twr_avail(x)

#define RAND_MAX TWR_RAND_MAX

#define rand(x) twr_rand(x)
#define srand(x) twr_srand(x)

#define __min(x, y) twr_minint(x, y)
#define __max(x, y) twr_maxint(x, y)

#define atof(x) twr_atof(x)
#define atoi(x) twr_atoi(x)
#define atol(x) twr_atol(x)
#define atoll(x) twr_atoll(x)
#define strtol(a,b,c) twr_strtol(a,b,c)
#define _itoa_s(x,y,z,zz) twr_itoa_s(x,y,z,zz)
#define _fcvt_s(a,b,c,d,e,f) twr_fcvt_s(a,b,c,d,e,f)
~~~

Note that _fcvt_s as currently enabled has these limitations:
   - fractional digits <=100
   - values must be less than 1e+21
   - values negative exponents must be smaller than 1e-99

There is a full featured version of _fcvt_s in the source code, but is not currently enabled, since the version enabled is smaller and works in most use cases.
## assert.h
~~~
void assert(int expression);
~~~

## math.h
~~~
#define abs(x) twr_wasm_abs(x)
#define acos(x) twr_wasm_acos(x)
#define asin(x) twr_wasm_asin(x)
#define atan(x) twr_wasm_atan(x)
#define ceil(x) twr_wasm_ceil(x)
#define cos(x) twr_wasm_cos(x)
#define exp(x) twr_wasm_exp(x)
#define fabs(x) twr_wasm_fabs(x)
#define floor(x) twr_wasm_floor(x)
#define fmod(x) twr_wasm_fmod(x)
#define log(x) twr_wasm_log(x)
#define pow(x,y) twr_wasm_pow(x,y)
#define sin(x) twr_wasm_sin(x)
#define sqrt(x) twr_wasm_sqrt(x)
#define tan(x) twr_wasm_tan(x)
#define trunc(x) twr_wasm_trunc(x)
~~~

## stdarg.h
~~~
#define va_start(v,l)	__builtin_va_start(v,l)
#define va_end(v)	__builtin_va_end(v)
#define va_arg(v,l)	__builtin_va_arg(v,l)
#define va_copy(d,s)	__builtin_va_copy(d,s)
typedef __builtin_va_list va_list;
~~~

## ctype.h
~~~
#define isgraph(x) twr_isgraph(x)
#define isspace(x) twr_isspace(x)
#define isdigit(x) twr_isdigit(x)
#define isalpha(x) twr_isalpha(x)
#define isalnum(x) twr_isalnum(x)
#define toupper(x) twr_toupper(x)
#define tolower(x) twr_tolower(x)
~~~

## stddef.h
~~~
#ifdef __cplusplus
#define NULL __null
#else
#define NULL ((void*)0)
#endif

typedef twr_size_t size_t;
#define MAX_SIZE_T TWR_MAX_SIZE_T  // size_t max
#define offsetof(TYPE, MEMBER) __builtin_offsetof (TYPE, MEMBER)
~~~

## string.h
~~~
#define strlen(x) twr_strlen(x)
#define strdup(x) twr_strdup(x)
#define strcpy(x, y) twr_strcpy(x,y)
#define strncpy(x,y,z) twr_strncpy(x,y,z)
#define strcmp(x,y) twr_strcmp(x, y)
#define strcat_s(x,y,z) twr_strcat_s(x,y,z);
#define strnicmp(x,y,z) twr_strnicmp(x, y, z)
#define stricmp(x,y) twr_stricmp(x, y)
#define strncmp(x,y,z) twr_strncmp(x,y,z)
#define strstr(x,y) twr_strstr(x, y)
#define memset(x,y,z) twr_memset(x,y,z)
#define memcpy(x,y,z) twr_memcpy(x,y,z)
~~~

## time.h
~~~
typedef unsigned long time_t;
#define time(t) twr_wasm_time(t)
~~~

## Other include files available
~~~
float.h
limits.h
stdbool.h
stdint.h
~~~

