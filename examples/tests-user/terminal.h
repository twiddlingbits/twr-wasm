#include "twr-io.h"
#include <string>


class twrTerminal {
  public:
    twrTerminal();
    
	std::string& getInputLine(void);
 	void cls(void);

	private:
		struct IoConsoleWindow* m_iow;
		std::string m_lastInputLine;
};


