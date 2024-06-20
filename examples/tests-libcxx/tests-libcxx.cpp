#include <iostream>
#include <vector>
#include <string>
#include <random>
#include <clocale>
#include <regex>
#include <codecvt>
#include <typeinfo>
#include <string_view>
#include <cuchar> // For char16_t and char32_t conversions

bool testUnicodeSupport(void);
bool testRttiSupported(void);
void dotest(void);


extern "C" void testslibcxx() {
	dotest();
}

void dotest() {

	//////////////////////////////////////////////

	std::cout << "Hello World!" << std::endl;

	//////////////////////////////////////////////

	if (testUnicodeSupport()) {
   	std::cout << "Unicode support is enabled in libc++." << std::endl;
    } else {
   	std::cout << "Unicode support is NOT enabled in libc++." << std::endl;
    }

	//////////////////////////////////////////////

    if (testRttiSupported()) {
        std::cout << "RTTI is enabled." << std::endl;
    } else {
        std::cout << "RTTI is NOT enabled." << std::endl;
    }

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

//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////

// requires -std=c++20
std::u8string convert_to_utf8(const std::u32string& u32str) {
    std::u8string u8str;
    char32_t* src = const_cast<char32_t*>(u32str.data());
    char8_t dst[4]; // UTF-8 can be up to 4 bytes per character
    std::mbstate_t state = std::mbstate_t();

    size_t len = u32str.size();
    for (size_t i = 0; i < len; ++i) {
        size_t ret = c32rtomb(reinterpret_cast<char*>(dst), src[i], &state);
        if (ret == static_cast<size_t>(-1)) {
         	std::cout << "Conversion error";
				abort();
        }
        u8str.append(dst, ret);
    }

    return u8str;
}

bool testUnicodeSupport() {
	setlocale(LC_ALL, ""); // enable utf-8 locale
    std::u32string u32_str = U"Hello, 🌍!";
    std::u8string utf8_str32 = convert_to_utf8(u32_str);
    const std::u8string expected_utf8_str = u8"Hello, 🌍!";
    return utf8_str32 == expected_utf8_str;
}

bool testRttiSupported() {
	class Base {
	public:
		virtual ~Base() = default;
	};

	class Derived : public Base {
	};

	Base* basePtr = new Derived();

   const bool r = typeid(*basePtr) == typeid(Derived);

   delete basePtr;

	return r;
}



