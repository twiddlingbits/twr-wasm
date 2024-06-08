#include <iostream>
#include <locale>

int main() {

  	std::cout << std::setlocale(LC_ALL, "") << "\n";

	std::locale locale("");

   std::cout << ":" << locale.name().c_str() << ":\n";
   return 0;
}
