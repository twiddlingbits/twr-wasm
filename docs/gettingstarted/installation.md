---
description: How to install twr-wasm on your computer so that you can compile and link C/C++ to WebAssembly (Wasm).
---

# Installing twr-wasm
There are two methods with different pros and cons:

- `npm install` will install everything necessary to build your software: built libraries (lib-js, lib-c) and includes.  In addition the examples are installed.
- `git clone` will copy the built libraries (lib-js, lib-c), includes, as well as the source, examples, doc source and VS Code settings.

When using `twr-wasm` your applications needs to access both JavaScript and C twr-wasm libraries.  This is explained in the installation sections below, as well as in the [hello world walk through](./helloworld.md).

## npm install
~~~sh
npm install twr-wasm
~~~
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
The JavaScript and TypeScript exports are in `lib-js` and should be found by VS Code, TypeScript or your bundler as usual when using a statement like `import {twrWasmModule} from "twr-wasm"`.  

The C library (`twr.a`) that you will need to link your C/C++ program to is found in the `libs-c` folder, and the C/C++ include files that you will need to use in your C/C++ program are found in the `include` folder.  

You will need to use paths to to these folders in your make file. See the [hello world walk through](./helloworld.md). All of the [examples](../examples/examples-overview.md) have make files that use a relative path for `twr.a` and `includes`. These paths will work fine if your code is in an examples sub-folder as a peer to the other examples.  But assuming your code is in your own project folder elsewhere, you will need to determine the correct path to `twr.a` and `includes` for your project's make file.  Details on how to do this can be found in the following sections: [Hello World walk through](../gettingstarted/helloworld.md) and the [Compiler and Linker Options section](../gettingstarted/compiler-opts.md).

There is no real downside to this installation method, except possibly: (1) it does not include source code (use git clone for that), and (b) the C libraries are buried inside your node_modules.

## git install
~~~sh
 git clone https://github.com/twiddlingbits/twr-wasm
~~~

This method of installation installs the complete code base, including source and build binaries.   

The primary downside to this method is that the JavaScript side of twr-wasm will not be placed in a node_modules folder. This will create a little extra work to configure a bundler, TypeScript or VS Code to find the location of imports.

There are a few solutions to this.  In the provided hello world example, I use a `package.json` file with an `alias` entry.  This syntax is supported by the Parcel bundler:

~~~json
{
   "@parcel/resolver-default": {
      "packageExports": true
   },
   "alias": {
      "twr-wasm": "../../lib-js/index.js"
   },
   "dependencies": {
      "twr-wasm": "^2.0.0"
   }
}
~~~

In the [FFT example](../examples/examples-fft.md), I use the `paths` entry in the `tsconfig.json` file.  This is found by TypeScript, VS Code and the Parcel bundler.

~~~json
"paths": {
   "twr-wasm": ["./../../lib-js/index"]
}
~~~

The paths for `alias` and `paths` shown above are correct for the included examples, but will likely need to be adjust for your project. See [Hello World walk through](../gettingstarted/helloworld.md)

## clang and wasm-ld
To build C/C++ code for use in your Wasm project, you will need to install clang and the wasm-ld linker.  If you are using Windows, more details can be found at [the end of the Building Source section.](../more/building.md)
