# Big Integer C Library

twr-bigint.c, twr-bigint.h

This big integer code allows operations on an integer of an arbitrary large number of bits.

This implementation of an unsigned big integer has the following benefits:
   - easy to incorporate into your project
		- copy bigint.c and bigint.h
   - has no external dependencies (for example, does not use stdlib)
   - is implemented in C
   - is simple, small, lightweight

## To Use In Your Project
copy bigint.c and bigint.h into your project.

This bigint library is also available as part of my tiny-wasm-runtime library (for which it was created, to implement various float functions).

## Documentation
See bigint.h for a list of functions available.

See factorial.c for a simple example.

Functions are available for multiplication, division, addition, subtraction, bit manipulation, base 10 and 2 integer logarithms, power (exponent), digit counting, text conversion (for printing or inputting ASCII), and comparison.

The bigint is an array of 32 bit words of arbitrary length.  This implementation uses a fix size bigint.  You can change the size in the bigint.h file.  This method was helpful for use with my wasm crt since it allows bigints that don't use malloc.  This also allows bigint to be implemented without depending on a crt (c runtime library) and makes it easy to allocate bigints on the stack.

## Makefile
The GNU makefile will build the unit tests and the factorial example.

## Author
Written by Anthony Wood
2023





