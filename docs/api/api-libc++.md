# libC++
You can build tiny-wasm-runtime projects in C++ with our without the standard c++ library.

See the examples tests-libcxx and tests-user for examples of using libc++.

See the balls example for building a C++ app without the standard C++ library.  The primary advantage to this approach is a bit smaller code size.  You don't need to staticly link libc++.

The standard llvm clang libc++ library is available built for wasm (find in `lib-c/libc++.a`).  See the tests-libcxx example with makefile.

libc++ was built with these build options:

~~~
	LIBCXX_ENABLE_LOCALIZATION=ON
	LIBCXX_ENABLE_FILESYSTEM=OFF
	LIBCXX_ENABLE_TIME_ZONE_DATABASE=OFF
	LIBCXX_ENABLE_MONOTONIC_CLOCK=OFF
	LIBCXX_ENABLE_RANDOM_DEVICE=OFF
	LIBCXX_ENABLE_UNICODE=OFF
	LIBCXX_ENABLE_WIDE_CHARACTERS=OFF 
~~~