#!/bin/sh

# This script builds libc++.a for twr-wasm
# tested with llvm version 17.0.6
#
# libc++.a will be copied into lib-c
# the appropriate libc++ includes will be copied into include
#
# both lib-c and include contian only build artifacts, even thought I check them into github.
#
# assumes that directory "llvm-project" is in the same directory as twr-wasm (they should be peers)
# assumes you have cloned tag 17.0.6 https://github.com/llvm/llvm-project into the above directory
# git clone --depth 1 -b llvmorg-17.0.6 https://github.com/llvm/llvm-project.git 
#

set -e  # exit if any command returns non zero

rm -f  ../../lib-c/libc++.a
rm -f -r ../../include/c++

cp libcxxabi-patches/src/CMakeLists.txt ../../../llvm-project/libcxxabi/src/
cp libcxxabi-patches/src/cxa_default_handlers.cpp ../../../llvm-project/libcxxabi/src/
cp libcxxabi-patches/src/cxa_handlers.cpp ../../../llvm-project/libcxxabi/src/
cp libcxxabi-patches/src/cxa_noexception.cpp ../../../llvm-project/libcxxabi/src/

cp -r include-next ../../include/

cd ../../../llvm-project

rm -f -r build
mkdir -p build

cmake -G Ninja -S runtimes -B build    \
	-DCMAKE_BUILD_TYPE=Release		\
	-DCMAKE_CXX_STANDARD=20 \
	-DCMAKE_C_COMPILER=clang   \
	-DCMAKE_CXX_COMPILER=clang++  \
	-DLLVM_ENABLE_LLD=ON    \
	-DLLVM_ENABLE_RUNTIMES="libcxx;libcxxabi"  \
	-DLIBCXX_ADDITIONAL_COMPILE_FLAGS=@../../twr-wasm/source/libcxx/compile_flags.txt  \
	-DLIBCXXABI_ADDITIONAL_COMPILE_FLAGS=@../../twr-wasm/source/libcxx/compile_flags.txt  \
	-DLLVM_TARGET_TRIPLE=wasm32 \
	-DLLVM_DEFAULT_TARGET_TRIPLE=wasm32 \
	-DLIBCXXABI_USE_LLVM_UNWINDER=OFF \
	\
	-DCMAKE_SYSTEM_NAME=Generic \
	-DCMAKE_SYSTEM_PROCESSOR=wasm32 \
	-DCMAKE_SYSTEM_VERSION=unknown \
	\
	-DLIBCXX_ENABLE_EXCEPTIONS=OFF \
	-DLIBCXXABI_ENABLE_EXCEPTIONS=OFF \
	 \
	-DLIBCXX_ENABLE_THREADS=OFF \
	-DLIBCXXABI_ENABLE_THREADS=OFF \
	-DLIBCXXABI_HAS_PTHREAD_API=OFF \
	 \
	-DLIBCXX_ENABLE_STATIC_ABI_LIBRARY=ON \
	-DLIBCXXABI_ENABLE_STATIC_UNWINDER=ON \
	-DLIBCXXABI_ENABLE_STATIC=ON \
	-DLIBCXX_ENABLE_SHARED=OFF \
	-DLIBCXXABI_ENABLE_SHARED=OFF  \
	\
	-DLIBCXX_INCLUDE_BENCHMARKS=OFF \
	\
	-DLIBCXX_ENABLE_LOCALIZATION=ON \
	-DLIBCXX_ENABLE_UNICODE=ON \
	-DLIBCXX_ENABLE_RTTI=ON \
	-DLIBCXX_ENABLE_WIDE_CHARACTERS=OFF \
	-DLIBCXX_ENABLE_FILESYSTEM=OFF \
	-DLIBCXX_ENABLE_TIME_ZONE_DATABASE=OFF \
	-DLIBCXX_ENABLE_MONOTONIC_CLOCK=OFF \
	-DLIBCXX_ENABLE_RANDOM_DEVICE=OFF

ninja -v -C build cxx cxxabi

cp build/lib/libc++.a  ../twr-wasm/lib-c/
cp -r build/include/c++ ../twr-wasm/include/

printf "\nlibc++ build complete." 

# for when we add unwindder support
# for when we add unwindder support
# -DLIBUNWIND_ADDITIONAL_COMPILE_FLAGS=@C:/GitHubClonesDev/twr-wasm/source/libcxx/compile_flags_unwind.txt  \
# -DLIBUNWIND_ENABLE_THREADS=OFF \
# -DLIBUNWIND_ENABLE_SHARED=OFF \
# -DLIBCXXABI_ENABLE_STATIC_UNWINDER=ON \

# didn't do anything
#	-DLLVM_RUNTIME_TARGETS=WebAssembly \


# NOTES to self

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

#	-DLLVM_INCLUDE_TESTS=OFF \
# option(LIBUNWIND_USE_COMPILER_RT "Use compiler-rt instead of libgcc" OFF)

#Previously, we would define new/delete in both libc++ and libc++abi. Not only does this cause code bloat, but also it's technically an ODR violation since we don't know which operator will be selected. Furthermore, since those are weak definitions, we should strive to have as few of them as possible (to improve load times).
#My preferred choice would have been to put the operators in libc++ only by default, however that would create a circular dependency between libc++ and libc++abi, which GNU linkers don't handle.
#Folks who want to ship new/delete in libc++ instead of libc++abi are free to do so by turning on LIBCXX_ENABLE_NEW_DELETE_DEFINITIONS at CMake configure time.
#On Apple platforms, this shouldn't be an ABI break because we re-export the new/delete symbols from libc++abi. This change actually makes libc++ behave closer to the system libc++ shipped on Apple platforms.
#On other platforms, this is an ABI break for people linking against libc++ but not libc++abi.



