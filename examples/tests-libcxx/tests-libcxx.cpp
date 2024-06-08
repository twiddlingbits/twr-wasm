#include <iostream>
#include <vector>
#include <string>
#include <random>
#include <clocale>
#include <regex>

void dotest() {

	std::cout << "Hello World!" << std::endl;

	//////////////////////////////////////////////

	std::string str = "this is my string!";
	const char* cstr = str.c_str();
	printf("string: %s\n", cstr);
	if (str!="this is my string!") {
		printf("ERROR! %d\n",__LINE__);
		abort();
	}

	str.push_back('x');
	str.push_back('y');
	str.push_back('z');

	cstr = str.c_str();
	printf("stringmod: %s\n", cstr);
	if (str!="this is my string!xyz") {
		printf("ERROR! %d\n",__LINE__);
		abort();
	}

	//////////////////////////////////////////////

	std::vector<int> v1, v2;

		v1.push_back(10);
		v1.push_back(20);
		v1.push_back(30);
		v1.push_back(40);
		v1.push_back(50);

		std::cout << "v1 = ";
		for (auto& v : v1) {
			std::cout << v << " ";
		}
		std::cout << std::endl;

		v2.assign(v1.begin(), v1.end());
		std::cout << "v2 = ";
		for (auto& v : v2){
			std::cout << v << " ";
		}
		std::cout << std::endl;

	if (v1!=v2) {
		printf("ERROR! %d\n",__LINE__);
		abort();
	}

	//////////////////////////////////////////////

	auto default_locale=std::setlocale(LC_ALL, "");
	std::cout << "default local is: " << default_locale << "\n";

	std::cout << "default locale roundabout name: " << std::locale(default_locale).name().c_str() << ":\n";
	
	std::cout << "C locale setting is " << std::locale("C").name().c_str() << '\n';

	std::locale classicLocale;
	std::cout << "Classic locale: " << classicLocale.name() << std::endl;

	// on startup, the global locale is the "C" locale
	std::cout << "Current global locale: " << std::locale().name() << std::endl;
	std::cout << 1000.01 << '\n';

	// replace the C++ global locale and the "C" locale with the user-preferred locale
	std::locale old=std::locale::global(std::locale(""));
	std::cout << "Old global locale: " << old.name() << std::endl;
	std::cout << "Updated global locale: " << std::locale().name() << std::endl;

	// use the new global locale 
	std::cout.imbue(std::locale());

	// output the same number again
	std::cout << 1000.01 << '\n';

	std::lconv* lc = std::localeconv();
	std::cout << "currency symbol: " << lc->currency_symbol
					<< '(' << lc->int_curr_symbol << ")\n";

	//////////////////////////////////////////////

	std::string target2("Drizzle");
	std::regex rx2(R"(D\w+e)"); // no double backslashes with raw string literal

	auto found = std::regex_match(target2.cbegin(), target2.cend(), rx2);
	if (found)
			std::cout << "Regex found in Drizzle" << std::endl;
	else
			std::cout << "Regex NOT found in Drizzle" << std::endl;

	if (!found) {
		printf("ERROR! %d\n",__LINE__);
		abort();
	}
}

extern "C" void testslibcxx() {
	dotest();
}
