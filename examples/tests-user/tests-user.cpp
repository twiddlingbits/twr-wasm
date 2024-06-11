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
static int echo(parseCommand);
static int get_etc(parseCommand myCmd);
static int setlocale(parseCommand myCmd);

std::map<std::string, FunctionPointer> cmdList = {

	{"strftime", strftime},
	{"help", print_help},
	{"echo", echo},
	{"get", get_etc},
	{"setlocale", setlocale},
};

extern "C" void tests_user(void) {
	twrTerminal myTerm;

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
	const char* r=setlocale(LC_ALL, myCmd.m_rest.c_str());
	if (r) {
		std::cout << r << '\n';
		return 1;
	}
	else	{
		std::cout << "unknown locale\n";
		return 0;
	}
}
