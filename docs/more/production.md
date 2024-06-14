<h1> Production</h1>

**Important Production Note**
Tiny Wasm Runtime class twrWasmModuleAsync uses SharedArrayBuffers, and there are special CORS headers needed for these, that are not widely enabled by default on web servers.  [server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) or [staticwebapp.config.json](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/staticwebapp.config.json) shows which headers to set (also see the SharedArrayBuffer documentation online).  
