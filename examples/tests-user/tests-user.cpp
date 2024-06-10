#include <stdio.h>
#include "parsecmd.h"
#include "terminal.h"

extern "C" void tests_user(void) {

	twrTerminal myTerm;

	while (1) {
		std::string& inputLine=myTerm.getInputLine();
		parseCommand myCmd(inputLine);
		printf("cmd: %s\n", myCmd.getCommand().c_str());
	}
}
