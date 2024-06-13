#include <iostream>
#include <map>
#include <stdio.h>
#include <locale.h>
#include "parsecmd.h"
#include "terminal.h"
#include "twr-crt.h"

typedef int (*FunctionPointer)(parseCommand);

static int print_help(parseCommand);
static int strftime(parseCommand);
static int time(parseCommand);
static int echo(parseCommand);
static int get_etc(parseCommand myCmd);
static int setlocale(parseCommand myCmd);
static int lang(parseCommand);
static int memstats(parseCommand);
static int unittests(parseCommand);
static int cls(parseCommand);


std::map<std::string, FunctionPointer> cmdList = {

	{"strftime", strftime},
	{"time", time},
	{"help", print_help},
	{"echo", echo},
	{"get", get_etc},
	{"setlocale", setlocale},
	{"lang", lang},
	{"memstats", memstats},
	{"unittests", unittests},
	{"cls", cls},
};

twrTerminal myTerm;

extern "C" void tests_user(void) {

	std::cout << "Hello! Welcome to the tiny-wasm-runtime test terminal.  Try 'help'.\n\n";

	while (1) {
		std::cout << "cmd> ";
		std::string& inputLine=myTerm.getInputLine();
		if (inputLine!="") {
			parseCommand cmdLine(inputLine);
			auto it = cmdList.find(cmdLine.m_cmd);
			if (it != cmdList.end()) {
				const FunctionPointer ptr=cmdList[cmdLine.m_cmd];
				const int r=ptr(cmdLine);
				if (r==0) std::cout << "Command failed\n";
			}
			else {
				std::cout << "Unknown command\n";
			}
		}
	}
}

////////////////////////////////////////////////////

static int print_help(parseCommand) {
	std::cout << "List of commands:\n";
	for (const auto& pair : cmdList) {
		std::cout << pair.first << "\n";
	}
	return 1;
}

static int strftime(parseCommand) {
	return strftime_unit_test();
}

static int time(parseCommand) {
	return time_unit_tests();
}

static int unittests(parseCommand) {
	printf("starting unit tests of tiny wasm runtime...\n");

	// printf("malloc_unit_test: %s\n", malloc_unit_test()?"success":"FAIL");  doesn't work here -- see example/tests
	printf("locale_unit_test: %s\n", locale_unit_test()?"success":"FAIL");
	printf("rand_unit_test: %s\n", rand_unit_test()?"success":"FAIL");
	printf("stdlib_unit_test: %s\n", stdlib_unit_test()?"success":"FAIL");
	printf("cvtint_unit_test: %s\n", cvtint_unit_test()?"success":"FAIL");
	printf("cvtfloat_unit_test: %s\n", cvtfloat_unit_test()?"success":"FAIL");
	printf("fcvt_unit_test: %s\n", fcvt_unit_test()?"success":"FAIL");
	printf("atof_unit_test: %s\n", atof_unit_test()?"success":"FAIL");
	printf("twr_dtoa_unit_test: %s\n", twr_dtoa_unit_test()?"success":"FAIL");
	printf("string_unit_test: %s\n", string_unit_test()?"success":"FAIL");
	printf("printf_unit_test: %s\n", printf_unit_test()?"success":"FAIL");
	
	printf("test run complete\n");

	return 1;
}

static int echo(parseCommand myCmd) {
	std::cout << myCmd.m_rest << '\n';
	return 1;
}

static int get_etc(parseCommand myCmd) {
	char buf[160];
	int r;
	char * rb;

	std::cout << "twr_getc32: ";
	r=twr_getc32();
	std::cout << "result: " << r << "\n";

	std::cout << "io_getc32: ";
	r=io_getc32(stdin);
	std::cout << "result: " << r << "\n";

	std::cout << "getc: ";
	r=getc(stdin);
	std::cout << "result: " << r << "\n";

	std::cout << "fgetc: ";
	r=fgetc(stdin);
	std::cout << "result: " << r << "\n";

	std::cout << "io_mbgetc: ";
	io_mbgetc(stdin, buf);
	int len=strlen(buf);
	std::cout << "result: " << buf << "(len=" << len << ") \n";

	std::cout << "io_mbgets: ";
	rb=io_mbgets(stdin, buf);
	len=strlen(rb);
	std::cout << "result: " << rb << "(len=" << len << ") \n";

	std::cout << "twr_mbgets: ";
	rb=twr_mbgets(buf);
	std::cout << "result: " << rb << "\n";

	std::cout << "test complete\n";

	return 1;
}

static int setlocale(parseCommand myCmd) {
	if (myCmd.m_options.size()==0) {
		std::cout << "current locale: " << setlocale(LC_ALL, NULL) << '\n';
		return 1;
	}
	else {
		std::string newlocale=myCmd.removeQuotes(myCmd.m_options[0]);
		const char* r=setlocale(LC_ALL, newlocale.c_str());
		if (r) {
			std::cout << "locale set to: " << r << '\n';
			return 1;
		}
		else	{
			std::cout << "unknown locale: " << newlocale << "\n";
			return 0;
		}
	}
}

static int lang(parseCommand) {
	std::cout << twr_get_navlang(NULL) << "\n";
	return 1;
}

static int memstats(parseCommand) {
	twr_mem_debug_stats(stdout);
	return 1;
}

static int cls(parseCommand) {
	myTerm.cls();
	return 1;
}



