#include <assert.h>
#include <twr-io.h>
#include "terminal.h"


twrTerminal::twrTerminal() {
    m_iow=(struct IoConsoleWindow*)twr_get_stdio_con();
    assert(m_iow->con.header.type&IO_TYPE_ADDRESSABLE_DISPLAY);
	 //setlocale(LC_ALL, "");  // turn on UTF-8.  
}

std::string& twrTerminal::getInputLine() {
	char buf[160];

	io_mbgets((struct IoConsole *)m_iow, buf);
	m_lastInputLine=buf;
	return m_lastInputLine;
}

 void twrTerminal::cls() {
	io_cls(m_iow);
 }


