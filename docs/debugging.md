<h1>Debugging</h1>

<h2>Debugging your C code</h2>
By default, the web browser debugger will not show C/C++ source code.  You will see the Web Assembly instructions.   Although there does appear to be a way to do source code level debugging in a browser  using Web Assembly, I have not taken the time yet to figure out how it works.

My method, as of now, is to use C/C++ code that is mostly debugged (using some other tool chain with a good source level debugger, like gcc on windows).

Then use:

~~~
#include "twr-wasm.h"

twr_conlog();
~~~

<h2>Testing Without a Web Server</h2>

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
