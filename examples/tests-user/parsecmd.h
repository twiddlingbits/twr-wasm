#include <string>
#include <map>

class parseCommand {
  public:
	parseCommand(const char* cmdLine);
	parseCommand(std::string& cmdLine) : parseCommand(cmdLine.c_str()) {};

	 bool isFlagSet(const char* flag);
	 bool isFlagSet(std::string flag);
	 std::string& getFlagValue(const char* flag);
   
	public:
		std::string m_cmd;
		std::string m_rest;
	private:
		std::string m_empty;
   	std::map<std::string, std::string> m_flags;
};
