<h1>Installation</h1>
~~~
 git clone https://github.com/twiddlingbits/tiny-wasm-runtime
~~~
or
~~~
   npm install tiny-wasm-runtime
~~~

- `git clone` will copy the built libraries (lib-js, lib-c) as well as the source, examples, docs and VS Code settings.
- `npm install` will copy the minimum necessary to build your software: built libraries (lib-js, lib-c) and the examples.

Either will work.

**Installs for your C/C++ code**

  To build C/C++ code for use in your wasm project, you will need to install clang and the wasm-ld linker.  If you are using Windows, more details can be found at [the end of the Building Source section.](../more/building.md)

