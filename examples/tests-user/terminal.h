#include "twr-io.h"
#include <string>


class twrTerminal {
  public:
    twrTerminal();
    
	std::string& getInputLine(void);
 	void cls(void);

	private:
		twr_ioconsole_t* m_io;
		std::string m_lastInputLine;
};


