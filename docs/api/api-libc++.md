# libc++ for Web Assembly
This section describes twr-wasm's support for using the standard c++ library libc++ with Web Assembly.

twr-wasm includes libc++ built for Web Assembly and included in the `twr-wasm/lib-c` folder.

For C++ the use of libc++ is optional.  That is you can build twr-wasm projects in C++ with or without libc++.

See the examples tests-libcxx and tests-user for examples of using libc++.

See the balls example for how to create a C++ Web Assembly program without the standard C++ library.  The primary advantage to this approach is a bit smaller code size.  You don't need to staticly link libc++.

Some of the key options twr-wasm's libc++ for Web Assembly was built with are these:

~~~
DLIBCXX_ENABLE_LOCALIZATION=ON 
DLIBCXX_ENABLE_UNICODE=ON 
DLIBCXX_ENABLE_RTTI=ON 
DLIBCXX_ENABLE_STATIC_ABI_LIBRARY=ON 

DCMAKE_BUILD_TYPE=Release		
DCMAKE_CXX_STANDARD=20 

DLIBCXX_ENABLE_EXCEPTIONS=OFF 
DLIBCXX_ENABLE_THREADS=OFF 
DLIBCXX_ENABLE_SHARED=OFF 
DLIBCXX_ENABLE_WIDE_CHARACTERS=OFF 
DLIBCXX_ENABLE_FILESYSTEM=OFF 
DLIBCXX_ENABLE_TIME_ZONE_DATABASE=OFF 
DLIBCXX_ENABLE_MONOTONIC_CLOCK=OFF 
DLIBCXX_ENABLE_RANDOM_DEVICE=OFF
~~~

