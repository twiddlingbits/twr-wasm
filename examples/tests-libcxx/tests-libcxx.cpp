#include <string>

extern "C" void testslibcxx() {
	std::string str = "this is my string!";
   const char* cstr = str.c_str();
	printf("string: %s\n", cstr);

   str.push_back('x');
   str.push_back('y');
   str.push_back('z');

   cstr = str.c_str();
	printf("stringmod: %s\n", cstr);
}
