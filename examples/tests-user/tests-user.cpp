#include <stdio.h>
#include "parsecmd.h"
#include "terminal.h"

extern "C" void test_ui(void) {

	twrTerminal myTerm;
	std::string inputLine;

	while (1) {
		inputLine=myTerm.getInputLine();
		parseCommand myCmd(inputLine);
		printf("cmd: %s\n", myCmd.getCommand().c_str());
	}
}
