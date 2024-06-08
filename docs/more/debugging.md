<h1>Debugging</h1>

<h2>Debug & Release libs</h2>
There are release (twr.a) and debug (twrd.a) versions of the tiny-wasm-runtime C library.  See the tests example for use of both.  The "debug" version has debug symbols enabled and is built with -O0.  The "release" version has no debug symbols and optimization is set to -O3.  Both have asserts enabled.  In general, you should use the "release" version unless you wish to step through the tiny-wasm-runtime source -- in which case use the "debug" version.

libc++.a is not built with debug symbols.

<h2>C/C++ Source Level Debugging</h2>
In order to enable C/C++ source debugging with wasm and clang, do the following:

1. Use Chrome
2. Install the Chrome extension: C/C++ DevTools Support (DWARF) ( https://chromewebstore.google.com/detail/pdcpmagijalfljmkmjngeonclgbbannb )
3. Use the clang compile flag -g to add debug annotation to your object files
4. You will may want to turn off optimization to allow the debugger to have a bit more logical behavior (remove the -O flag or set to -O0) 
5. You may want to use the version of the tiny-wasm-runtime C library that has debug symbols enabled (twrd.a).  Only if you want to step into the twrd.a source.
6. You need to serve your files with a (likely local) web server.  For example, 'python server.py' is provided.  'server.py' can be found in the examples root folder.  Note that your local server needs to enable SharedArrayBuffers -- see the server.py example.
   - your code can be bundled or unbundled, but
   - you need to ensure that the web server/browser can find the source code
   - also see [Example Readme](https://github.com/twiddlingbits/tiny-wasm-runtime/blob/main/examples/readme.md)

<h2>Useful Functions</h2>

Use `twr_conlog` to print 'printf' style to the JavaScript console from C (reference is elsewhere in this doc.)
~~~
#include "twr-wasm.h"

twr_conlog("hello 99 in hex: %x",99);
~~~

Use `twrWasmModule.divLog()` to print to a div inside JavaScript code (reference is elsewhere in this doc.)

<h2>Testing Without a Web Server</h2>

Note: If you use this technique, you will not be able to get the c/C++ DevTool chrome extension to run, and so source level debugging won't work.

You can execute and debug JavaScript with wasm from local files without an HTTP server.  It might be helpful to download the tiny-wasm-runtime source code from github when you do this (so you can step through the tiny-wasm-runtime typescript code as needed).

See the examples and [Example Readme](https://github.com/twiddlingbits/tiny-wasm-runtime/blob/main/examples/readme.md) for more detail on how this works.

In general, you will need to add a clip of code similar to this to your HTML:
~~~
	<!-- also set tsconfig.json 'paths' -->
	<script type="importmap">
		{
		  "imports": {
			"tiny-wasm-runtime": "./../../lib-js/index.js",
			"whatkey": "./../../lib-js/whatkey.js"
		  }
		}
	</script>
~~~

Make sure the paths are correct.

You will need to set the following flags when running chrome from the shell (the first is only strictly required if using twrWasmModuleAsync):

~~~
--enable-features=SharedArrayBuffer
--allow-file-access-from-files
~~~

You can create a launch.json entry similar to this:
~~~
    {
        "name": "Examples",
        "type": "chrome",
        "request": "launch",
        "runtimeArgs": ["--allow-file-access-from-files","--autoplay-policy=no-user-gesture-required","--enable-features=SharedArrayBuffer"],
        "file": "${workspaceFolder}/examples/index.html",
            "cwd": "${workspaceFolder}/examples/"
    }
~~~
