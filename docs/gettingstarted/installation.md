<h1>Installation</h1>
~~~
 git clone https://github.com/twiddlingbits/twr-wasm
~~~
or
~~~
   npm install twr-wasm
~~~

- `git clone` will copy the built libraries (lib-js, lib-c), include, as well as the source, examples, docs and VS Code settings.
- `npm install` will copy the minimum necessary to build your software: built libraries (lib-js, lib-c), include and the examples.

Either will work.

**Installs for your C/C++ code**

  To build C/C++ code for use in your wasm project, you will need to install clang and the wasm-ld linker.  If you are using Windows, more details can be found at [the end of the Building Source section.](../more/building.md)

**A Note on npm install**

After installation from npm, you will have a folder structure like this:

~~~
node_modules\
   twr-wasm\
      examples\
      include\
      lib-c\
      lib-js\
      LICENSE
      package.json
      readme.md
~~~
The JavaScript exports are in `lib-js` and should be found by your TypeScript/JavaScript code as usual with a statement like `import {twrWasmModule} from "twr-wasm"`.  

The C library (`twr.a`) that you will need to link your C/C++ program to is found in the `libs-c` folder, and the C/C++ include files that you will need to use in your C/C++ program are found in the `include` folder.   You will need to use paths to to these folders [in your make file](compiler-opts.md).  All of the examples (in the `examples` folder above) have make files that use a relative path for `twr.a` and `includes`. These paths will work fine if your code is in an examples sub-folder as a peer to the other examples.  But assuming your code is in your own project folder elsewhere, you will need to determine the correct path to `twr.a` and `includes` from your project's make file.
