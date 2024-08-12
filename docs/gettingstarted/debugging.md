---
title: Debugging C/C+ WebAssembly
description: How to debug and step through WebAssembly C/C++ Source Code
---

# Debugging WebAssembly
This section describes tips for debugging your WebAssembly (Wasm) program.  Some of these techniques are WebAssembly generic, some are specific to using twr-wasm.

## Debug and Release libraries
There are release (twr.a) and debug (twrd.a) versions of the twr-wasm C library.  The "debug" version has debug symbols enabled with `-g` and is built with optimizations disabled via `-O0`.  The "release" version has no debug symbols and optimization is set to `-O3`.  Both have asserts enabled.  In general, you should use the "release" version unless you wish to step through the twr-wasm source -- in which case use the "debug" version.

libc++.a is not built with debug symbols.

## Source Level Debugging WebAssembly C/C++
In order to enable C/C++ source debugging with Wasm and clang, do the following:

1. Use Chrome
2. Install the Chrome extension: [C/C++ DevTools Support (DWARF)](https://chromewebstore.google.com/detail/pdcpmagijalfljmkmjngeonclgbbannb)
3. Use the clang compile flag -g to add debug annotation to your object files
4. You may want to turn off optimization to allow the debugger to have a bit more logical behavior (remove the `-O` flag or set to `-O0`) 
5. You may want to use the version of the twr-wasm C library that has debug symbols enabled (twrd.a).  Only if you want to step into the twrd.a source.
6. You need to serve your files with a (likely local) web server.  
7. For example, 'python server.py' is provided.  'server.py' can be found in the examples root folder.  Note that your local server needs to enable SharedArrayBuffers if you are using `twrWasmModuleAsync` -- [see these CORS notes.](../more/production.md)
   - your code can be bundled or unbundled, but
   - you need to ensure that the web server/browser can find the source code
   - also see [Example Readme](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/readme.md)

## Resolving Imports
If you are having issues with import resolution, [see this section.](../more/imports.md)

## Useful twr-wasm Debug Functions
Use `twr_conlog` to print to the JavaScript console from C (see API ref section).
~~~c
#include "twr-wasm.h"

twr_conlog("hello 99 in hex: %x",99);
~~~

Inside JavaScript, you can print to a console using the `putStr` console member function that is available on all consoles.

For example:
~~~js
const stream1 = new twrConsoleDiv(stream1Element);
stream1.putStr(`Hello stream1 of type ${stream1.getProp("type")} from JavaScript!\n`);
~~~

## Testing WebAssembly Without a Web Server
Note: If you use this technique, you will not be able to get the C/C++ DevTool chrome extension to run, and so source level debugging won't work. (If you know how to fix this, please contact me on github.)

You can execute and debug JavaScript with Wasm from local files without an HTTP server.  It might be helpful to download the twr-wasm source code from github when you do this (so you can step through the twr-wasm typescript code as needed).

See the examples and [Example Readme](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/readme.md) for more detail on how this works.

In general, you will need to add a clip of code similar to this to your HTML:
~~~html
<script type="importmap">
   {
      "imports": {
      "twr-wasm": "./../../lib-js/index.js"
      }
   }
</script>
~~~

Make sure the paths to  `twr-wasm/lib-js/index.js` are correct for where your source is located.  The above is correct for the provided examples.

You will need to set the following flags when running chrome from the shell or VS Code (the first is only strictly required if using twrWasmModuleAsync).

~~~
--enable-features=SharedArrayBuffer
--allow-file-access-from-files
~~~

If you are using VS Code, You can create a launch.json entry similar to this:

~~~json title="launch.json"
{
	"configurations": [
	{
		"name": "Launch Chrome",
		"request": "launch",
		"type": "chrome",
		"runtimeArgs": [
			"--allow-file-access-from-files",
			"--autoplay-policy=no-user-gesture-required",
			"--enable-features=SharedArrayBuffer"
		 ],
		 "file": "${workspaceFolder}/index.html",
		 "cwd": "${workspaceFolder}/",
	}
	]
}
~~~
