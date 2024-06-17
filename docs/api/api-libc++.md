# Using libc++ with Web Assembly
This section describes twr-wasm's support for using the standard c++ library libc++ with Web Assembly.

libc++ has been built for Web Assembly and included in the `twr-wasm/lib-c` folder.

You can build twr-wasm projects in C++ with or without libc++.

See the examples tests-libcxx and tests-user for examples of using libc++.

See the balls example for how to create a C++ Web Assembly program without the standard C++ library.  The primary advantage to this approach is a bit smaller code size.  You don't need to staticly link libc++.

libc++ was built with these build options:

~~~
LIBCXX_ENABLE_LOCALIZATION=ON
LIBCXX_ENABLE_STATIC_ABI_LIBRARY=ON
LIBCXXABI_ENABLE_STATIC_UNWINDER=ON
LIBCXXABI_ENABLE_STATIC=ON

LIBCXX_ENABLE_FILESYSTEM=OFF
LIBCXX_ENABLE_TIME_ZONE_DATABASE=OFF
LIBCXX_ENABLE_MONOTONIC_CLOCK=OFF
LIBCXX_ENABLE_RANDOM_DEVICE=OFF
LIBCXX_ENABLE_UNICODE=OFF
LIBCXX_ENABLE_WIDE_CHARACTERS=OFF 
LIBCXX_ENABLE_EXCEPTIONS=OFF
LIBCXXABI_ENABLE_EXCEPTIONS=OFF
LIBCXX_ENABLE_RTTI=OFF
LIBCXX_ENABLE_THREADS=OFF
LIBCXXABI_ENABLE_THREADS=OFF
LIBCXXABI_HAS_PTHREAD_API=OFF
LIBCXX_ENABLE_SHARED=OFF
LIBCXXABI_ENABLE_SHARED=OFF 
~~~