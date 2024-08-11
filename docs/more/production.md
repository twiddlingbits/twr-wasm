---
title: CORS headers needed to use twrWasmModuleAsync
description: twr-wasm class twrWasmModuleAsync uses SharedArrayBuffers, and there are special CORS headers that need to be enabled to use SharedArrayBuffers.
---

# HTTP CORS headers needed to use twrWasmModuleAsync

If you are using twr-wasm with web pages served by an http server, you may need to enable certain CORS headers.  This applies whether using a remote server or using your local machine for development.

twr-wasm class `twrWasmModuleAsync` uses `SharedArrayBuffers`, and there are special CORS headers that need to be configured to use `SharedArrayBuffers`, that are not widely enabled by default on web servers.  It may be helpful to also see the `SharedArrayBuffer` documentation online.

Github pages doesn't support the needed CORS headers for SharedArrayBuffers.  But other web serving sites do have options to enable the needed CORS headers.

Here are two provided examples of how to enable the necessary headers:

- [server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) 
- [staticwebapp.config.json](https://github.com/twiddlingbits/twr-wasm/blob/main/scripts/staticwebapp.config.json) 

The azure static web site config file `staticwebapp.config.json` looks like this:
~~~json
{
    "globalHeaders": {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
}
~~~

[server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) in the examples folder will launch a local server with the correct headers.  To use Chrome without a web server, see the [Hello World walk through](../gettingstarted/helloworld.md).

# Using twrWasmModuleAsync with file:

If you are loading html with chrome from files (not using an https server), you will need to set these command line args:

~~~
--enable-features=SharedArrayBuffer
--allow-file-access-from-files
~~~

More detail is found in the [debugging section.](../gettingstarted/debugging.md)
