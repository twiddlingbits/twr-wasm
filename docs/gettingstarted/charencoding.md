---
title: Unicode and Character Encoding in C/C++ WebAssembly
description: Create Wasm code using twr-wasm's support for ASCII, UTF-8  windows-1252, and UTF-32 character encoding.
---

# Introduction to Character Encoding Support with twr-wasm
This section explains twr-wasm's WebAssembly support for ASCII, UTF-8, windows-1252, and UTF-32 character encoding.

## Getting Started
When using C with twr-wasm, you will likely want to add this line to the start of your code:
~~~
setlocale(LC_ALL, "")
~~~

This will change the C locale language to the one selected in the browser, and will enable consistent UTF-8 character encoding support.

Without this line, the standard C runtime will (mostly) default character encoding to ASCII, as per the standard.  The exception is that just as with gcc, twr-wasm consoles support **outputting** UTF-8.

## Character Encodings
twr-wasm supports ASCII, UNICODE, and extended-ASCII (in the form of Windows-1252).

These days UNICODE with UTF-8 encoding is the most popular method of displaying and encoding text. UTF-8 is popular because it has the deep character glyph definitions of UNICODE with an encoding that provides (a) the best backwards compatibility with ASCII, and (b) a compact memory footprint.  It does this at the expense of some multibyte complexities.

UTF-8 is variable length, and uses between one to four bytes to represent any unicode code point, with ASCII compatibility in the first 128 bytes.  It is also the standard for the web, and the default for clang. But because UTF-8 uses a variable number of bytes per character it can make string manipulation in C a bit harder than ASCII, Windows-1252 or UTF-32.

In this document you will see the term "locale". This term originated (at least as its commonly used in programming) in the standard C library, and is also used in the standard C++ library (libc++ in twr-wasm).  A locale refers to a region of the world, along with a specific character encoding. The twr-wasm standard c runtime uses a label akin to this to define a locale: `en-US.UTF-8`. Of note is that libc++ and the standard C runtime have different domains for their locales (ie, they don't directly impact each other).  You can learn more about locales by searching the internet. 

twr-wasm C locales support ASCII, UTF-8 or windows-1252 character encoding.  UTF-16/32 are not supported as a std c lib locale setting, but functions are provided to convert utf-32 (unicode code points) to and from ASCII, UTF-8, and windows-1252 "code pages" (there are other miscellaneous utf-32 based functions as well.)

Although twr-wasm's standard c library locale doesn't support utf-32 directly, you can use int arrays (instead of byte arrays) to hold utf-32 strings, and then convert them to/from utf-8 with the help of the provided functions for this purpose.  Alternately, you can use libc++, which has classes that directly support utf-16 and utf-32.

## Windows Compatibility with Windows-1252
Windows-1252 is the default character encoding on Windows computers in many countries - particularly the Americas and western Europe -- and particularly when using MSVC. Linux, clang, gcc, and the web commonly default in some way to UTF-8 character encoding.  Windows-1252 is an extension of ASCII that uses a single byte per character.  This makes it easier than UTF-8 from a programmers perspective, but it doesn't represent as many characters. It is supported by twr-wasm to make it easier to port legacy C code, windows code, as well as a simpler alternative to UTF-8.

twr-wasm supports Windows-1252, and you can enable it like this:

~~~
setlocale(LC_ALL, ".1252")
~~~

This will set the locale to the default browser language, and character encoding to Windows-1252.

**1252 String Literals**
These days text editors generally default to UTF-8.  In order to use windows-1252  source code and/or string literals, such as `const char * str="€100"` you may need to: 

   - Configure your text editor to save in Windows-1252/ISO-8859-1 format (instead of UTF-8)
   - use compiler flags like `--finput-charset` and `-fexec-charset`
  
  By default, the Microsoft Visual Studio C compiler (MSVC) does not treat string literals as UTF-8. Instead, it treats them as being encoded in the current code page of the system, which is typically Windows-1252 on western european language Windows systems.  twr-wasm is designed to work with clang, which does default to utf-8, so if you are compiling code written for MSVC, and you use extend character sets (non ASCII), you may need to adjust your compiler settings with the flags mentioned above.

## More
For more details see [Localization Reference for twr-wasm](../api/api-localization.md)


