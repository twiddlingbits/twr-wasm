---
title: Resolving Import Statements
description: How tools like VS Code, the Parcel bundler, and Web browser's resolve import statements
---

# twr-wasm Import Resolution
This section covers path resolution for statements like this:
~~~
import {twrWasmModule} from "twr-wasm";
~~~

It can be confusing to determine how tools like VS Code, a bundler, or a Web Browser resolve imports like "twr-wasm".  This section explains how it works, using the included examples as examples.

If you have installed `twr-wasm` using `npm`, most tools will automatically resolve imports by finding the `node_modules` folder.

However, if you installed using `git clone`, then other steps will need to be taken.  The examples are in the git repo tree, and as a result there may be no `node_modules` for the twr-wasm libraries.  This will also be the case for your project, if you installed with `git clone`.

## Import path resolution by the bundler
A bundler will find the twr-wasm library using one of these methods:

1. If twr-wasm has been installed with npm install, the bundler will find the `node_modules` folder
2. Alternately, If all your scripts are in TypeScript, use `paths`  entry in `tsconfig.json` (see maze example)
3. Alternately, use alias option in package.json as in the helloworld example
~~~
     "alias": {
          "twr-wasm": "../../lib-js/index.js"
     },
~~~
  
In the examples, the alias entry in the `package.json` exists so that the parcel bundler can find twr-wasm.

If you are using a bundler, you don't need to add a `<script type="importmap">` tag.  

## Import path resolution by the browser
This section apples to executing your javascript without first "bundling" it.  Whether execution is from the filesystem directly in a browser or using a web server. 

In order for the browser to locate the twr-wasm path when import is used,  you can add code like this to your HTML prior to the import.  You should make sure the path for twr-wasm is correct for your project (this is correct for the examples).
~~~
<script type="importmap">
    {
        "imports": {
        "twr-wasm": "../../lib-js/index.js"
        }
    }
</script>
~~~

## Import resolution by VS Code and tsc 
VS Code Intellisense and the typescript compiler need to find modules.  If twr-wasm is installed using `npm` into a `node_modules` folder, this is probably automatic.  But if this is not the case, you can add a line to the `tsconfig.json` as follows (this example assumes the `tsconfig.json` is in a examples/example folder).  See the maze example.
~~~
"paths": {
   "twr-wasm": ["./../../lib-js/index"]
}
~~~





