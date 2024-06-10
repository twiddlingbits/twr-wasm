#include <assert.h>
#include <twr-io.h>
#include "terminal.h"


twrTerminal::twrTerminal() {
    struct IoConsoleWindow* m_iow=(struct IoConsoleWindow*)twr_get_stdio_con();
    assert(m_iow->con.header.type&IO_TYPE_WINDOW);
	 setlocale(LC_ALL, "");  // set user default locale, which is always UTF-8.  This is here to turn on UTF-8.
}

std::string& twrTerminal::getInputLine() {
	char buf[160];

	io_mbgets((struct IoConsole *)m_iow, buf);
	m_lastInputLine=buf;
	return m_lastInputLine;
}

