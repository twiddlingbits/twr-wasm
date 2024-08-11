# Examples
These examples demonstrate the features of twr-wasm.

# Run Examples with pre-build `.wasm`
Each example incudes the built `.wasm` file in its folder, allowing you to execute the "unbundled version" of the examples without rebuilding.  The `index.html` file in the examples root contains links to each example.

## Execute examples with local web server
When executing the examples with a local web server, because of the use of Shared Array Buffers, certain HTTP headers must be set.  If you use the included `server.py` to create a local web server, these headers are set. 

To execute the examples:
~~~
cd <twr-wasm root folder>
python examples/server.py
~~~

then in your browser:

~~~
http://localhost:8000/examples/
~~~

Note: Only the "unbundled" version of the examples is available if you don't build the examples.
Note: You must run `python` from the twr-wasm root.

## Execute Examples using Chrome without a local web server 
An alternative and simple way to run the examples locally without using a local web server is to use the included VS Code `launch.json`.  This file is not included if you install with `npm`.  To access this file, you should [install using git clone.](https://twiddlingbits.dev/docsite/gettingstarted/installation/).  Then from VS Code, select "Run and Debug" in the left menu, and use the "start debugging" button at the top.

The examples will run without building using chrome and a file:// URL.  The file "index.html" can be loaded to provide links to each example.  If you are going to run Chrome yourself from a shell, see the section below on some of the Chrome flags you will need to set.

# Building the examples
## Prerequisites
   - Ensure clang and wasm-ld are installed
   - Ensure a version of gnu make is installed (to use the Makefiles).  
   - the examples use parcel v2 as a bundler 
   - to run the examples on your local machine using the provided server script (server.py), you need to install python.  This script sets certain CORS headers needed by SharedArrayBuffer, that are not usually set using other dev servers.

## Build and execute the examples with a local http server

~~~
cd examples
sh buildbundle.sh
~~~

To execute the bundled or unbundled versions, use this python script to launch a local web server with the correct CORS settings,  while in the repo root folder.

~~~
cd <twr-wasm root folder>
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

## Building a single example
To build and execute an individual example do this:
1. cd to the example's folder (eg. helloworld)
2. make
3. launch as described in the section "Build and execute the examples without a http server"

# Import Resolution
For a tutoiral on how imports are resolved by the examples, see https://twiddlingbits.dev/docsite/more/imports/