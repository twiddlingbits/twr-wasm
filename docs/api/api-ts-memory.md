---
title: TypeScript-JavaScript API to access data in WebAssembly memory
description: twr-wasm provides TypeScript/JavaScript classes to read and write integers, doubles, strings, and more from WebAssembly Memory
---

# Accessing Data in WebAssembly Memory
There are situations where you may need to access WebAssembly memory from your TypeScript code. For example, if you need to allocate a new string, de-reference a pointer, or examine or modify a structure. A [`TwrLibrary`](../api/api-ts-library.md) in particular may need to do this. ( For background on the issues involved in using WebAssembly Memory with C and TypeScript see  [Passing Function Arguments from JavaScript to C/C++ with WebAssembly](../gettingstarted/parameters.md).).

 To access WebAssembly memory you will use the `wasmMem` public member variable:

- `twrWasmModule` has the public member variable `wasmMem:IWasmMemory`
- `twrWasmModuleAsync` has the public member variable `wasmMem:IWasmMemoryAsync`

If you are writing a [`twrLibrary`](./api-ts-library.md), the appropriate `wasmMem` is the first parameter of your import functions.

Both versions of wasmMem extend `IWasmMemoryBase` which has common functions for retrieving or setting values from WebAssembly memory.  With `IWasmMemoryAsync`, for functions that call `malloc`, `await` must be used.  This shows up in the `IWasmMemoryAsync` versions of  the `PutXXX` functions that return a Promise.  This situation arises when using `twrWasmModuleAsync`.  The reason is that `PutXX` makes a call to `malloc`, and in `twrWasmModuleAsync`, `malloc` needs to message the Worker thread and `await` for a response.

Note: In prior versions of twr-wasm, these functions were available directly on the module instance.  For example, `mod.GetString`.  These functions have been deprecated.   Now you should use `mod.wasmMem.getString` (for example).

~~~js
// IWasmMemoryBase operate on shared memory, so they will function in any WasmModule 
export interface IWasmMemoryBase {
   memory:WebAssembly.Memory;
   mem8:Uint8Array;
   mem32:Uint32Array;
   memD:Float64Array;
   stringToU8(sin:string, codePage?:number):Uint8Array;
   copyString(buffer:number, buffer_size:number, sin:string, codePage?:number):void;
   getLong(idx:number): number;
   setLong(idx:number, value:number):void;
   getDouble(idx:number): number;
   setDouble(idx:number, value:number):void;
   getShort(idx:number): number;
   getString(strIndex:number, len?:number, codePage?:number): string;
   getU8Arr(idx:number): Uint8Array;
   getU32Arr(idx:number): Uint32Array;
}

// IWasmMemory does not support await, and so will only work in a thread that has the module loaded
// That would be twrWasmModule, twrWasmModuleAsyncProxy
export interface IWasmMemory extends IWasmMemoryBase {
   malloc:(size:number)=>number;
   free:(size:number)=>void;
   putString(sin:string, codePage?:number):number;
   putU8(u8a:Uint8Array):number;
   putArrayBuffer(ab:ArrayBuffer):number;
}

// IWasmMemoryAsync must be used from an async function since await is needed
export interface IWasmMemoryAsync extends IWasmMemoryBase {
   malloc:(size:number)=>Promise<number>;
   free:(size:number)=>Promise<void>;
   putString(sin:string, codePage?:number):Promise<number>;
   putU8(u8a:Uint8Array):Promise<number>;
   putArrayBuffer(ab:ArrayBuffer):Promise<number>;
}
~~~
