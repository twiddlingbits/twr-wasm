# libC++
You can build tiny-wasm-runtime projects in C++ with our without the standard c++ library.

See the balls example for building a c++ app without the standard c++ library.  The primary advantage to this approach is smaller code size.  You don't need to staticly link libc++.

The standard llvm clang libc++ library is available built for wasm (lib-c/libc++.a).  See the tests-libcxx example for the makefile.

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