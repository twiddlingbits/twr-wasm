---
title: Building the twr-wasm Source
description: This section describes the tools to install and the scripts to use, in order to build the twr-wasm source, examples, and docs
---

# Building the twr-wasm Source
## Source for twr-wasm
The source can be found at:

~~~
https://github.com/twiddlingbits/twr-wasm
~~~

The `main` branch contains the latest release.  The `dev` branch is work in progress.

## Tools Needed to Build twr-wasm Source
You will need these core tools, versions used in release are in ():

- TypeScript (5.4.5)
- clang tool chain (17.0.6) - for C/C++ code
- wasm-ld (17.0.6) - to link the .wasm files
- wat2wasm (1.0.34) - to compile WebAssembly (.wat) files of which I have a few 
- GNU make (4.4.1)
- git - to clone twr-wasm source, or to clone llvm, if you want to build libc++

In addition, you might need:

- VS Code - to use the debug launcher and build tasks
- NPM - package manager
- Parcel v2 - to bundle the examples
- mkdocs, material theme, meta-descriptions plugin - to build the documentation static web site
- python - mkdocs is built with python, and you need python to run server.py in examples
- CMake and ninja - to build llvm libc++

There is a deprecated gcc build that I used to use for testing, but now the tests are executed in wasm.

## To Build the Libraries (lib-c, lib-js)

~~~sh
cd source
make
~~~
or on windows
~~~sh
cd source
mingw32-make
~~~

## To Build the Examples

See [examples/readme.md](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/readme.md) for more information.

To build the examples, but not bundle them. 
~~~sh
cd examples
sh buildall.sh
~~~

To build bundles:
~~~sh
sh buildbundles.sh
~~~

## To Build the docs
The docs are created using the material theme for mkdocs.

In twr-wasm root folder:

~~~sh
mkdocs build
~~~

The destination of the build is found in the `mkdocs.yml` file (`site_dir: azure/docsite/`).

Usually the docs are built as part of building the static web site that hosts the docs and examples.  This is accomplished using this shell script (found in examples folder):
~~~sh
buildazure.sh
~~~

## To Build libc++ for Wasm and twr-wasm

See the instructions in the comments in the shell script `source\libcxx\buildlibcxx.sh`

## Installing clang and wasm-ld on Windows

Here is how I installed the tools for windows: 

~~~
 install  MSYS2 
   1. https://www.msys2.org/
   2. After the install completes, run UCRT64 terminal by clicking on the MSYS2 UCRT64 in the Start menu
   3. pacman -Syuu

 install gcc using MSYS2 UCRT64
   1. Use MSYS2 UCRT64 terminal (per above)
   1. pacman -S mingw-w64-ucrt-x86_64-toolchain

 install clang and wasm-ld using MSYS2 UCRT64
   2. Use MSYS2 UCRT64  (per above)
      1. pacman -S mingw-w64-ucrt-x86_64-clang
      2. pacman -S mingw-w64-x86_64-lld

update PATH env variable using the windows control panel (search for path)
   2. added C:\msys64\ucrt64\bin 
   3. added C:\msys64\mingw64\bin 
   4. added C:\msys64\usr\bin (for sh.exe used by mingw32-make)
~~~
  
wabt tools: 
can be found here https://github.com/WebAssembly/wabt/releases 
