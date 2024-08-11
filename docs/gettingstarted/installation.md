---
description: How to install twr-wasm on your computer so that you can compile and link C/C++ to WebAssembly (Wasm).
---

# Installing twr-wasm
A simple way to install twr-wasm is:
~~~
npm install twr-wasm
~~~

See the "Hello World walk through" in the following section for more specifics.

There are actually two methods of installation with different pros and cons:

- `npm install` will install everything necessary to build your software: built libraries (lib-js, lib-c) and includes.  In addition the examples are installed.
- `git clone` will copy the above as well as the source and VS Code settings.

When using `twr-wasm` your applications needs to access both JavaScript and C twr-wasm libraries.  This is explained in the installation sections below, as well as in the [Hello World walk through](./helloworld.md).

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

The C library (`twr.a`) that you will need to link your C/C++ program to is found in the `libs-c` folder, and the C/C++ include files that you will need to use in your C/C++ program are found in the `include` folder.  You will need to use paths to to these folders in your makefile. See the [Hello World walk through](./helloworld.md) for details. 

There is no real downside to this installation method, except possibly: (1) it does not include source code (use git clone for that), and (b) the C libraries are buried inside your node_modules.

## git install
~~~sh
 git clone https://github.com/twiddlingbits/twr-wasm
~~~

This method of installation installs the complete code base, including source and built binaries.   

The primary downside to this method is that the JavaScript side of twr-wasm will not be placed in a node_modules folder. This will create a little extra work to configure a bundler, TypeScript or VS Code to find the location of imports.

There are a few solutions to this.  For example, in the provided Hello World example, a `package.json` file with an `alias` entry is used.  This syntax is supported by the Parcel bundler:

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

The [FFT example](../examples/examples-fft.md) uses the `paths` entry in the `tsconfig.json` file.  This is found by TypeScript, VS Code and the Parcel bundler.  This is probably the best solution if you are using TypeScript.

~~~json
"paths": {
   "twr-wasm": ["./../../lib-js/index"]
}
~~~

The paths for `alias` and `paths` shown above are correct for the included examples, but will likely need to be adjust for your project.

For more details [see this section on Import Resolution](../more/imports.md)

## clang and wasm-ld
To build C/C++ code for use in your Wasm project, you will need to install clang and the wasm-ld linker.  If you are using Windows, more details can be found at [the end of the Building Source section.](../more/building.md)

## python and more
To use the included `examples\server.py` to execute your project you will need to install python.  `server.py` is a simple HTTP server for local testing that sets the [correct CORS headers](../more/production.md) for `twrWasmModuleAsync`.  As explained in the Hello World walk through, you can alternately execute HTML files directly using VS Code and Chrome.

You will likely want these tools installed to use twr-wasm:

- gnu make (all the examples use make)
- VS Code (not required, but the repo includes VS Code launch.json, etc)
- TypeScript (not required, but the twr-wasm source code is TypeScript)
  
## Note on Examples
[You can run the examples](../examples/examples-overview.md) either locally or with the online versions.
