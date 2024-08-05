#include <stdio.h>
#include <stdlib.h>
#include "twr-crt.h"

void multi() {

	// enable UTF-8
	setlocale(LC_ALL, ""); 

	// these are all being directed to the browser debug console in this example
	printf("Welcome to the multi-io demo!  This line is going to stdout\n");
	twr_conlog("And this line is going to stderr");
	fprintf(stderr, "This is also going to stderr\n");

	if (twr_get_console("this is not a real console name")!=NULL) {
		twr_conlog("Error! console name found");
		abort();
	}

	struct IoConsole * stream1=twr_get_console("stream1");
	// Since we know "stream1" was created in index.html, this check is not needed
	// Plus, if we make an error, there will be an exception when we try and use the NULL console
	// but this check is here since this code is also used to test twr-wasm APIs
	if (stream1==NULL) {
		twr_conlog("Error! stream1 not found");
		abort();
	}

	struct IoConsole * stream2=twr_get_console("stream2");
	if (stream2==NULL) {
		twr_conlog("Error! stream2 not found");
		abort();
	}

	struct IoConsole * term1=twr_get_console("term1");
	if (term1==NULL) {
		twr_conlog("Error! term1 not found");
		abort();
	}

	struct IoConsole * term2=twr_get_console("term2");
	if (term2==NULL) {
		twr_conlog("Error! term2 not found");
		abort();
	}

	fprintf(stream1, "Hello Stream One!\n");
	fprintf(stream2, "Hello Stream Two!\n");
	fprintf(term1, "Hello Terminal One!\n");
	fprintf(term2, "Hello Terminal Two!\n");
	
	char buffer[100];
	fprintf(stream1, "Type Something: ");
	io_mbgets(stream1, buffer);
	fprintf(stream1, "You typed: %s\n", buffer);

	fprintf(stream2, "Type Something: ");
	io_mbgets(stream2, buffer);
	fprintf(stream2, "You typed: %s\n", buffer);

	fprintf(term1, "Type Something: ");
	io_mbgets(term1, buffer);
	fprintf(term1, "You typed: %s\n", buffer);

	fprintf(term2, "Type Something: ");
	io_mbgets(term2, buffer);
	fprintf(term2, "You typed: %s\n", buffer);

}