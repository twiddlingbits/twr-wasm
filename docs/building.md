<h1>Building the Source</h1>
<h2>Tools needed</h2>
You will need these core tools:

- NPM - package manager
- Typescript
- clang tool chain - for C/C++ code
- wasm-ld - to link the .wasm files
- wat2wasm - to compile web assembly (.wat) files of which I have a few 
- GNU make

In addition, you might need:

- VS Code - to use the debug launcher and build tasks
- Parcel v2 - to bundle the examples
- mkdocs - to build the documentation static web site
- python - mkdocs is built with python, and you need to run server.py in examples

There is a gcc build that I sometimes use for testing, but you generally wont need to use it.

<h2>To Build the Librarys (lib-c, lib-js) </h2>
~~~
cd source
make
~~~
or on windows
~~~
cd source
mingw32-make
~~~

<h2>To Build the Examples</h2>
on Windows this will build the examples, but not bundle them. See examples/readme.md for more information.
~~~
cd examples
sh buildall.sh
~~~

<h2>Installing clang and wasm-ld on Windows</h2>
I wrote this using Windows, but it should work with any clang and typescript compatible platform

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
