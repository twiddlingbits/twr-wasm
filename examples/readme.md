# Examples
These examples demonstrate many of the features of twr-wasm.

The examples will run without building using chrome and a file:// URL.  The file "index.html" can be loaded to provide easy access to each example.  If you have downloaded the source from github, and you are using VS Code, there is a launch.json entry to run the examples this way.  You access it in the VS Code "run and debug" left-hand nav bar, then select it from the drop down at the top.  If you are going to run Chrome from the shell, see the section below on some of the flags you will need to set.

When using bundled examples with a local web server, because of the use of Shared Array Buffers, certain HTTP headers must be set -- see below and the included server.py script.

# Prerequisites
   - Ensure clang and wasm-ld are installed
   - Ensure a version of gnu make is installed (to use the Makefiles).  
   - the examples use parcel v2 as a bundler 
   - to run the examples on your local machine using the provided server script (server.py), you need to install python.  This script sets certain CORS headers needed by SharedArrayBuffer, that are not usually set using other dev servers.

# Build and execute the examples with a local http server

~~~
cd examples
sh buildbundle.sh
~~~

To execute the bundled or unbundled versions, use this python script to launch a local web server with the correct CORS settings,  while in the repo root folder.

~~~
cd twr-wasm
python examples/server.py
~~~

then in your browser:

~~~
http://localhost:8000/examples/
~~~

## Build and execute the examples without a http server

~~~
cd examples
sh buildall.sh
~~~

- Use the VS Code Launch.json "Examples" in the "run & debug" left-hand nav menu.
- or launch from the shell.  On windows, use a shell command akin to this:

~~~
start "chrome" "--allow-file-access-from-files --autoplay-policy=no-user-gesture-required --enable-features=SharedArrayBuffer file:///C:/GitHubClonesDev/twr-wasm/examples/index-file.html"
~~~

Ensure no chrome windows are open prior to running above.  Otherwise, the file will open in an existing chrome instance without setting the flags.

# package.json
The 'alias' entry in package.json is only needed if using the bundler and twr-wasm is not installed in a node_modules folder (as is the case with these examples), and if tsconfig.json is not used (the maze and fft examples use tsconfig.json)

# twr-wasm Import Resolution
This section covers path resolution for statements like this:
~~~
import {twrWasmModule} from "twr-wasm";
~~~

## import path resolution by the browser
This section apples to executing your javascript without first "bundling" it.  Either from the filesystem directly in a browser or using a web server. 

In order for the browser to locate the twr-wasm path when import is used,  you can add code like this to your HTML prior to the import.  You should make sure the paths are correct.
~~~
<script type="importmap">
    {
        "imports": {
        "twr-wasm": "../../lib-js/index.js"
        }
    }
</script>
~~~

## VS Code and tsc resolution
VS Code Intellisense and the typescript compiler need to find modules.  If twr-wasm is installed using npm into a node_modules folder, this is probably automatic.  But in these examples, we don't do that, and so, we added a line to the tsconfig.json as follows (this example assumes the tsconfig.json is in a examples/example folder)
~~~
"paths": {
   "twr-wasm": ["./../../lib-js/index"]
}
~~~

## Using the Parcel v2 bundler
If you are using a bundler, you don't need to add a \<script type="importmap"> tag.  However, you will need to do one of the following in order for the bundler to find twr-wasm.

1. If twr-wasm has been installed with npm install, the bundler will find the node_modules folder
2. Alternately, If all your scripts are in TypeScript, enter paths into tsconfig.json as above
3. Alternately, use alias option in package.json as in the helloworld example
~~~
     "alias": {
          "twr-wasm": "../../lib-js/index.js"
     },
~~~

# Building a single example
To build and execute an individual example do this:
1. cd to the example's folder (eg. helloworld)
2. make
3. launch as described in the section "Build and execute the examples without a http server"



