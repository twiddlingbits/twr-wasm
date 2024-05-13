<h1>Debugging</h1>

<h2>Debug & Release libs</h2>
There are debug (twrd.a) and release (twr.a) versions of the tiny-wasm-runtime C library.  The helloworld examples shows how to link to both.

There is only a release version of libc++.a

<h2>C/C++ Source Level Debugging</h2>
In order to enable C/C++ source debugging with wasm and clang, do the following:

1. Use Chrome
2. Install the Chrome extension: C/C++ DevTools Support (DWARF) ( https://chromewebstore.google.com/detail/pdcpmagijalfljmkmjngeonclgbbannb )
3. Use the clang compile flag -g to add debug annotation to your object files
4. You will probably want to turn off optimization (remove the -O flag or set to -O0)
5. You also likely want to use the debug version of the C library (twrd.a)
6. You need to serve your files with a (likely local) web server.  For example, 'python server.py'.  'server.py' can be found in the examples root folder.
   - your code can be bundled or unbundled, but
   - you need to ensure that the web server/browser can find the source code
   - also see [Example Readme](https://github.com/twiddlingbits/tiny-wasm-runtime/blob/main/examples/readme.md)

<h2>Useful Functions</h2>

Use `twr_conlog` to print 'printf' style to the Javascript console from C (reference is elsewhere in this doc.)
~~~
#include "twr-wasm.h"

twr_conlog("hello 99 in hex: %x",99);
~~~

Use `twrWasmModule.divLog()` to print to a div inside Javascript code (reference is elsewhere in this doc.)

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
