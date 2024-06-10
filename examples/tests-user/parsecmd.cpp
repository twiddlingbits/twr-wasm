#include <sstream>
#include <string>

#include "parsecmd.h"

parseCommand::parseCommand(const char* cmdLine) {
	std::stringstream ss(cmdLine);
	std::string word;

	ss >> m_cmd;

	while (ss >> word) {
		size_t pos = word.find('=');
		if (pos != std::string::npos) {
			std::string left = word.substr(0, pos);
			std::string right = word.substr(pos + 1);	
			m_flags[left] = right;
		}
		else {
			m_flags[word] = "";
		}
	}
}

std::string& parseCommand::getCommand(void) {
	return m_cmd;
}

bool parseCommand::isFlagSet(const char* flag) {
	auto it = m_flags.find(flag);
   return it != m_flags.end();
}

std::string& parseCommand::getFlagValue(const char* flag) {
	if (isFlagSet(flag))
		return m_flags[flag];
	else
		return m_empty;
}




