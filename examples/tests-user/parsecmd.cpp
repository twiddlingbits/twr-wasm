#include <sstream>
#include <string>

#include "parsecmd.h"

parseCommand::parseCommand(const char* cmdLine) {
	std::stringstream ss(cmdLine);
	std::string word;

	ss >> m_cmd;
	std::getline(ss >> std::ws, m_rest);
	ss=std::stringstream(m_rest);

	while (ss >> word) {
		m_options.push_back(word);
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

std::string parseCommand::trim(const std::string& str) {
    size_t first = str.find_first_not_of(' ');
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(' ');
    return str.substr(first, last - first + 1);
}

std::string parseCommand::removeQuotes(const std::string& str) {
    std::string trimmed = trim(str);
    if (trimmed.size() >= 2 && trimmed.front() == '"' && trimmed.back() == '"') {
        return trimmed.substr(1, trimmed.size() - 2);
    }
    return trimmed;
}




