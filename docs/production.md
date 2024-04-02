<h1> Production</h1>

**Important Production Note**
Tiny Wasm Runtime class twrWasmModuleAsync uses SharedArrayBuffers, and there are special CORS headers needed for these, that are not widely enabled by default.  server.py shows which headers to set (also see the SharedArrayBuffer documentation online).  
