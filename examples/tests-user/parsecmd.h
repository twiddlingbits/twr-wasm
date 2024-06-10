#include <string>
#include <map>

class parseCommand {
  public:
	parseCommand(const char* cmdLine);
	parseCommand(std::string& cmdLine) : parseCommand(cmdLine.c_str()) {};

	 std::string& getCommand(void);
	 bool isFlagSet(const char* flag);
	 bool isFlagSet(std::string flag);
	 std::string& getFlagValue(const char* flag);
   
	private:
		std::string m_empty;
		std::string m_cmd;
   	std::map<std::string, std::string> m_flags;
};
