---
title: CORS headers needed to use twrWasmModuleAsync
description: twr-wasm class twrWasmModuleAsync uses SharedArrayBuffers, and there are special CORS headers that need to be enabled to use SharedArrayBuffers.
---

# CORS headers needed to use twrWasmModuleAsync

**Important Production Note**

twr-wasm class `twrWasmModuleAsync` uses `SharedArrayBuffers`, and there are special CORS headers that need to be configured to use `SharedArrayBuffers`, that are not widely enabled by default on web servers.  The [server.py](https://github.com/twiddlingbits/twr-wasm/blob/main/examples/server.py) or [staticwebapp.config.json](https://github.com/twiddlingbits/twr-wasm/blob/main/scripts/staticwebapp.config.json) examples show which headers to set (also see the `SharedArrayBuffer` documentation online).  
