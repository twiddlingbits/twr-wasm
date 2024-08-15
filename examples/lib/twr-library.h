
#ifndef __TWR_LIBRARY__
#define __TWR_LIBRARY__

#ifdef __cplusplus
extern "C" {
#endif


__attribute__((import_name("twr_register_callback")))
int twr_register_callback(const char* func_name);


#ifdef __cplusplus
}
#endif

#endif
