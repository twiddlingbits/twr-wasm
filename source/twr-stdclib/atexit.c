// these functions don't currently do anything
// there is no 'main' to exit
//	note there is also a __wasm_call_dtors, which i don't currently call
// also see our initwasm.c code
//

#include <stdlib.h>

int atexit(void (*func)(void)) {
	return 0;
}

int __cxa_atexit (void (*callback)(void *), void *payload, void *dso_handle) {
	return 0;
}