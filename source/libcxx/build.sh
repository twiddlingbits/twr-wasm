#!/bin/sh

set -e  # exit if any command returns non zero

rm -f -r build
mkdir -p build

cmake -G Ninja -S runtimes -B build    \
	-DCMAKE_BUILD_TYPE=Release		\
	-DCMAKE_C_COMPILER=clang   \
	-DCMAKE_CXX_COMPILER=clang++  \
	-DLLVM_ENABLE_LLD=ON    \
	-DLLVM_ENABLE_RUNTIMES="libcxx;libcxxabi"  \
	-DLIBCXX_ADDITIONAL_COMPILE_FLAGS=@C:/GitHubClonesDev/tiny-wasm-runtime/source/libcxx/compile_flags.txt  \
	-DLIBCXXABI_ADDITIONAL_COMPILE_FLAGS=@C:/GitHubClonesDev/tiny-wasm-runtime/source/libcxx/compile_flags.txt  \
	-DLIBUNWIND_ADDITIONAL_COMPILE_FLAGS=@C:/GitHubClonesDev/tiny-wasm-runtime/source/libcxx/compile_flags_unwind.txt  \
	-DLLVM_TARGET_TRIPLE=wasm32 \
	-DLLVM_DEFAULT_TARGET_TRIPLE=wasm32 \
	-DLLVM_RUNTIME_TARGETS=wasm32 \
	-DLIBCXXABI_USE_LLVM_UNWINDER=OFF \
	\
	-DLIBCXX_ENABLE_EXCEPTIONS=OFF \
	-DLIBCXXABI_ENABLE_EXCEPTIONS=OFF \
	\
	-DLIBCXX_ENABLE_RTTI=OFF \
	 \
	-DLIBCXX_ENABLE_THREADS=OFF \
	-DLIBCXXABI_ENABLE_THREADS=OFF \
	-DLIBUNWIND_ENABLE_THREADS=OFF \
	-DLIBCXXABI_HAS_PTHREAD_API=OFF \
	 \
	-DLIBCXX_ENABLE_STATIC_ABI_LIBRARY=ON \
	-DLIBCXXABI_ENABLE_STATIC_UNWINDER=ON \
	-DLIBCXXABI_ENABLE_STATIC=ON \
	-DLIBCXX_ENABLE_SHARED=OFF \
	-DLIBCXXABI_ENABLE_SHARED=OFF  \
	-DLIBUNWIND_ENABLE_SHARED=OFF \
	\
	-DLIBCXX_ENABLE_FILESYSTEM=OFF \
	-DLIBCXX_ENABLE_TIME_ZONE_DATABASE=OFF \
	-DLIBCXX_ENABLE_MONOTONIC_CLOCK=OFF \
	-DLIBCXX_ENABLE_RANDOM_DEVICE=OFF \
	-DLIBCXX_ENABLE_LOCALIZATION=OFF \
	-DLIBCXX_INCLUDE_BENCHMARKS=OFF \
	-DLIBCXX_ENABLE_UNICODE=OFF \
	-DLIBCXX_ENABLE_WIDE_CHARACTERS=OFF 

ninja -C build cxx cxxabi
#mingw32-make -C build cxx cxxabi 

# C:\GitHubClonesDev\llvm-project\llvm\lib\Target\WebAssembly\README.txt
# https://github.com/emscripten-core/emscripten/tree/main/system/lib/libcxx

# https://danielmangum.com/posts/wasm-wasi-clang-17/
# try cxx cxxabi unwind
# take a look at this https://github.com/ARM-software/LLVM-embedded-toolchain-for-Arm/blob/main/docs/building-from-source.md

#	-DLLVM_INCLUDE_TESTS=OFF \
# option(LIBUNWIND_USE_COMPILER_RT "Use compiler-rt instead of libgcc" OFF)


#CMake Warning:
#  Manually-specified variables were not used by the project:

#    LIBCXXABI_ENABLE_RTTI
#    LIBUNWIND_ENABLE_EXCEPTIONS
#    LIBUNWIND_ENABLE_RTTI
#	  LLVM_RUNTIME_TARGETS=wasm32
#    LIBCXXABI_ADDITIONAL_COMPILE_FLAGS
#    LIBCXXABI_COMPILE_FLAGS
#    LIBCXXABI_ENABLE_EXCEPTIONS
#    LIBCXXABI_ENABLE_STATIC
#    LIBCXXABI_ENABLE_THREADS
#	-DLLVM_ENABLE_UNWIND_TABLES=OFF \

# -D__USING_WASM_EXCEPTIONS__
# -D_LIBUNWIND_HAS_NO_EXCEPTIONS - this does not seem to be used any longer

#	-DLIBCXXABI_USE_LLVM_UNWINDER=OFF \


#	-DLIBCXXABI_COMPILE_FLAGS=-emit-llvm \
#	-DLIBCXXABI_ENABLE_EXCEPTIONS=OFF \
#	-DLIBCXXABI_ENABLE_STATIC=ON \
#	-DLIBCXXABI_ENABLE_THREADS=OFF \


#	-DLIBCXX_ENABLE_NEW_DELETE_DEFINITIONS=ON \
#	-DLLVM_TARGET_ARCH=wasm32 \
#	-DLIBCXX_HAS_MUSL_LIBC 
#	-DLLVM_USE_LINKER=wasm-ld
# 	-DLLVM_ENABLE_LLD=ON                                                        \
# 
# LIBCXX_CXX_FLAGS: General flags for both the compiler and linker.
# LIBCXX_COMPILE_FLAGS: Compile only flags.
# LIBCXX_LINK_FLAGS: Linker only flags.
# LIBCXX_LIBRARIES: libraries libc++ is linked to.

#	-DClang_DIR=C:/msys64/ucrt64/bin \
#	-DLLVM_DIR=C:/msys64/ucrt64/bin \
#	-DLLVM_USE_LINKER=llvm-link
#	-DLLVM_NATIVE_TOOL_DIR=C:/msys64/ucrt64/bin  
#	-DLIBCXX_ENABLE_WIDE_CHARACTERS=OFF \
#	-DLLVM_DEFAULT_TARGET_TRIPLE=wasm32-unknown-unknown \

#Previously, we would define new/delete in both libc++ and libc++abi. Not only does this cause code bloat, but also it's technically an ODR violation since we don't know which operator will be selected. Furthermore, since those are weak definitions, we should strive to have as few of them as possible (to improve load times).
#My preferred choice would have been to put the operators in libc++ only by default, however that would create a circular dependency between libc++ and libc++abi, which GNU linkers don't handle.
#Folks who want to ship new/delete in libc++ instead of libc++abi are free to do so by turning on LIBCXX_ENABLE_NEW_DELETE_DEFINITIONS at CMake configure time.
#On Apple platforms, this shouldn't be an ABI break because we re-export the new/delete symbols from libc++abi. This change actually makes libc++ behave closer to the system libc++ shipped on Apple platforms.
#On other platforms, this is an ABI break for people linking against libc++ but not libc++abi.

# results in error: C:/GitHubClonesDev/llvm-project/build/include/c++/v1/wchar.h:112:6: error: "The <wchar.h> header is not supported since libc++ has been configured with LIBCXX_ENABLE_WIDE_CHARACTERS
# -DLIBCXX_ENABLE_WIDE_CHARACTERS=OFF 


