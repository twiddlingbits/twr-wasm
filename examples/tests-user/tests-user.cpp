#include <iostream>
#include <map>
#include "parsecmd.h"
#include "terminal.h"
#include "twr-crt.h"

typedef int (*FunctionPointer)();

static int print_help(void);

std::map<std::string, FunctionPointer> cmdList = {

	{std::string("strftime"), strftime_unit_test},
	{"help", print_help},
	{"h", print_help}

};

extern "C" void tests_user(void) {
	twrTerminal myTerm;

	while (1) {
		std::cout << "cmd> ";
		std::string& inputLine=myTerm.getInputLine();
		if (inputLine!="") {
			parseCommand cmdLine(inputLine);
			std::string& cmd=cmdLine.getCommand();
			auto it = cmdList.find(cmd);
			if (it != cmdList.end()) {
				const FunctionPointer ptr=cmdList[cmd];
				const int r=ptr();
				if (r==0) std::cout << "Command failed\n";
			}
			else {
				std::cout << "Unknown command\n";
			}
		}
	}
}

static int print_help(void) {
	std::cout << "List of commands:\n";
	for (const auto& pair : cmdList) {
		std::cout << pair.first << "\n";
	}

	return 1;
}
