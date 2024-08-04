#include <stdio.h>
#include <stdlib.h>
#include "twr-crt.h"

void multi() {

	// these are all being directed to the browser debug console in this example
	printf("Welcome to the multio-io demo!  This is going to stdout\n");
	twr_conlog("And this is going to stderr");
	fprintf(stderr, "This is also going to stderr\n");

	if (twr_jscon_from_name("this is not a real console name")!=NULL) {
		twr_conlog("Error! console name found");
		abort();
	}

	struct IoConsole * stream1=twr_jscon_from_name("stream1");
	// Since we know "stream1" was created in index.html, this check is not needed
	// Plus, if we make an error, there will be an exception when we try and use the NULL console
	// but this check is here since this code is also used to test twr-wasm APIs
	if (stream1==NULL) {
		twr_conlog("Error! stream1 not found");
		abort();
	}

	struct IoConsole * stream2=twr_jscon_from_name("stream2");
	if (stream2==NULL) {
		twr_conlog("Error! stream2 not found");
		abort();
	}

	fprintf(stream1, "Hello Stream One!\n");
	fprintf(stream2, "Hello Stream Two!\n");
	
}