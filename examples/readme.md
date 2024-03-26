# Examples
These examples demonstrate many of the features of tiny-wasm-runtime.

The examples will run without building using chrome and a file:// URL.  The file "index.html" can be loaded to provide easy access to each example.  If you have downloaded the source from github, and you are using VS Code, there is a launch.json entry to run the examples this way.  You access it in the VS Code "run and debug" left-hand nav bar, then select it from the drop down at the top.  If you are going to run Chrome from the shell, see the section below on some of the flags you will need to set.

When using bundled examples with a local web server, because of the use of Shared Array Buffers, certain HTTP headers must be set -- see below and the included server.py script.

# Prerequisites
   - Ensure clang and wasm-ld are installed
   - Ensure a version of GNU make is installed (to use the Makefiles).  
   - the examples use parcel v2 as a bundler 
   - to run the examples on your local machine using the provided server script (server.py), you need to install python.  This script sets certain CORS headers needed by SharedArrayBuffer, that are not usually set using other dev servers.

# To build all examples without bundling
cd to the examples folder.  Then on windows with mingw:
~~~
sh buildall.sh
~~~

Otherwise
~~~
buildall.sh
~~~

to execute the examples built this way, use the VS Code launcher which will run the example using a chrome and the files (no web server).

# To build all examples with bundling
There is a script to build the bundled versions as well.  To execute the bundled versions, use
~~~
python server.py
~~~

## Run examples using file:// with Chrome

- Use the VS Code Launch.json "Examples" in the "run & debug" left-hand nav menu.
- or launch from the shell.  On windows, use a shell command akin to this:

~~~
start "chrome" "--allow-file-access-from-files --autoplay-policy=no-user-gesture-required --enable-features=SharedArrayBuffer file:///C:/GitHubClonesDev/tiny-wasm-runtime/examples/index-file.html"
~~~

Ensure no chrome windows are open prior to running above.  Otherwise, the file will open in an existing chrome instance without setting the flags.

## To run examples with local HTTP server using bundler
After buildall.sh:
~~~
python server.py
~~~
then in your browser:
~~~
http://localhost:8000/dist/index.html
~~~

# package.json
The 'alias' entry in package.json is only needed if using the bundler and tiny-wasm-module is not installed in a node_modules folder (as is the case with these examples), and if tsconfig.json is not used (the maze and fft examples use tsconfig.json)

# tiny-wasm-runtime Import Resolution
This section covers path resolution for statements like this:
~~~
import {twrWasmModule} from "tiny-wasm-runtime";
~~~

## import path resolution by the browser
This section apples to executing your javascript without first "bundling" it.  Either from the filesystem directly in a browser or using a web server. 

In order for the browser to locate the tiny-wasm-runtime path when import is used,  you can add code like this to your HTML prior to the import.  You should make sure the paths are correct.
~~~
<script type="importmap">
    {
        "imports": {
        "tiny-wasm-runtime": "../../lib-js/index.js",
        "whatkey": "../../lib-js/whatkey.js"
        }
    }
</script>
~~~

In the above example I also added a mapping for 'whatkey' since it is imported / used in the tiny-wasm-modules implementation.

## VS Code and tsc resolution
VS Code Intellisense and the typescript compiler need to find modules.  If tiny-wasm-runtime is installed using npm into a node_modules folder, this is probably automatic.  But in these examples, I don't do that, and so, I added a line to the tsconfig.json as follows (this example assumes the tsconfig.json is in a examples/example folder)
~~~
"paths": {
   "tiny-wasm-runtime": ["./../../lib-js/index"]
}
~~~

## Using the Parcel v2 bundler
If you are using a bundler, you don't need to add a \<script type="importmap"> tag.  However, you will need to do one of the following in order for the bundler to find tiny-wasm-runtime.

1. If tiny-wasm-runtime has been installed with npm install, the bundler will find the node_modules folder
2. Alternately, If all your scripts are in Typescript, enter paths into tsconfig.json as above
3. Alternately, use alias option in package.json as in the helloworld example
~~~
     "alias": {
          "tiny-wasm-runtime": "../../lib-js/index.js"
     },
~~~

# Building a single example
To build and execute an individual example do this:
1. cd to the example folder (eg. helloworld)
2. make
3. launch as described in the section "Run examples using file:// with Chrome"



