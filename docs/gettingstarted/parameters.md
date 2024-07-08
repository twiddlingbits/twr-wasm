---
title: Passing Function Parameters to WebAssembly
description: Learn techniques to transfer data between JavaScript/TypeScript and C/C++ with WebAssembly. We delves a bit “under the covers”.
---

# Passing Function Parameters to WebAssembly

This article describes techniques to transfer data between JavaScript/TypeScript and C/C++ when using WebAssembly. It delves a bit “under the covers” to explain how this works when you use a library like twr-wasm or Emscripten. In this article, I am using twr-wasm for the examples. Emscripten does something similar.

For an example that illustrates the concepts discussed here, see: [the callC example](../examples/examples-callc.md/).

## WebAssembly Virtual Machine Intrinsic Capabilities

The WebAssembly VM (often referred to as a Wasm “Runtime”) is limited to passing numbers between C functions and the Wasm host (I’ll assume that’s JavaScript for this document). In other words, if you are using the most basic WebAssembly capabilities provided by JavaScript, such as `WebAssembly.Module`, `WebAssembly.Instance`, and `instance.exports`, your function calls and return types can only be:

   - Integer 32 bit
   - Floating point 32 or 64 bit

The WebAssembly spec supports: i32, i64, f32, and f64. But JavaScript doesn’t support 64-bit integers without using the `BigInt` type. The JavaScript Number is always a `Float64`, known as a “double” in C/C++. A JavaScript Number can be converted to a `Float32` or an `Integer32`.

When using 32-bit WebAssembly (by far the most common default), and you call a C function from JavaScript without using any “helper” libraries, the following parameter types can be passed:

   - Integer 32: JavaScript `Number` type is converted to an `Integer32` and passed to C when the C function prototype specifies a signed or unsigned int, long, int32_t, or a pointer type. All of these are 32 bits in length in wasm32.
   - JavaScript `Number` type is passed as a `Float64` when the C function prototype specifies a double.
   - JavaScript `Number` type is converted to a Float32 when the C function prototype specifies a float.
  
The same rules apply to the return types.

## Passing Strings from JavaScript to C/C++ WebAssembly

Although you can use the technique I am about to describe here directly (by writing your own code), it is generally accomplished by using a third-party library such as twr-wasm or Emscripten. These libraries handle the nitty-gritty for you. To pass a string from JavaScript/TypeScript to a WebAssembly module, the general approach is to:

   - Allocate memory for the string inside the WebAssembly memory. This is typically done with malloc. malloc returns a pointer, which is an index into the WebAssembly Memory.
   - Copy the string to this allocated memory. In the case of twr-wasm, this copying also converts the character encoding as necessary, for example, to UTF-8.
   - Pass the malloc'd memory index to your function as an integer (which is accepted as a pointer by C code).
   - 
In the case of twr-wasm, this is handled for you by the `callC` function.

~~~
callC(["my_function", "this is my string"]);
~~~

Under the covers, callC will execute code like this:

~~~js
async putString(sin, codePage = codePageUTF8) {
    const ru8 = this.stringToU8(sin, codePage);  // ru8 is of type Uint8Array
    const strIndex = await this.malloc(ru8.length + 1);
    this.mem8.set(ru8, strIndex);  // mem8 is of type Uint8Array and is the Wasm Module’s Memory
    this.mem8[strIndex + ru8.length] = 0;
    return strIndex;
}
~~~
`this.malloc` is the standard C runtime `malloc` function, provided by twr-wasm, and linked into your `.wasm` code that is loaded into the WebAssembly Module. Likewise, twr-wasm will call `free` after the function call is executed.

## Returning a String from C/C++ WebAssembly to JavaScript

Returning a string from C to JavaScript is the reverse of passing in a string from JavaScript to C. When the “raw” WebAssembly capabilities are used (`WebAssembly.Module`, etc.) and your C code looks like this:

~~~c
return("my string");
~~~

The WebAssembly VM and JavaScript host will cause your JavaScript to receive an unsigned 32-bit integer. This is the pointer to the string, cast to an unsigned 32-bit integer. This integer is an index into the WebAssembly Memory.

twr-wasm provides a function to pull the string out of WebAssembly Memory and convert the character encoding to a JavaScript string. JavaScript strings are Unicode 16, but twr-wasm supports ASCII, UTF-8, and windows-1252 string encoding. When extracted and converted, a copy of the string is made.

~~~js
const retStringPtr = await mod.callC(["ret_string_function"]);
console.log(mod.getString(retStringPtr));
~~~

The `retStringPtr` is an integer 32 (but converted to a JavaScript `Number`, which is `Float64`). This integer is an index into the WebAssembly Memory.

## Passing Structs from JavaScript to C/C++ WebAssembly

To pass a C struct (or receive a C struct), the same techniques used for strings can be used. The primary new complexity is that each struct entry’s memory address needs to be calculated. And when calculating the WebAssembly Memory indices for the struct entries, C structure padding must be accounted for. 

In clang, if you declare this structure in your C code:

~~~c
struct test_struct {
    int a;
    char b;
    int *c;
};
~~~

 - The first entry, `int a`, will be at offset 0 in memory.
 - The second entry, `char b`, will be at offset 4 in memory. This is expected since the length of an int is 4 bytes.
 - The third entry, `int *c`, will be at offset 8 in memory, not at offset 5 as you might expect. The compiler adds three bytes of padding to align the pointer to a 4-byte boundary.

This behavior is dependent on your compiler, cpu, and whether you are using 32 or 64-bit architecture. For wasm32 with clang:

 - char is 1 byte aligned
 - short is 2 byte aligned
 - pointers are 4 byte aligned
 - int, long, int32_t are 4 byte aligned
 - double (`Float 64`) is 8-byte aligned
  
If you are not familiar with structure padding, there are many articles on the web.

Alignment requirements are why twr-wasm `malloc` (and GCC `malloc` for that matter) aligns new memory allocations on an 8-byte boundary.

When accessing a C struct in JavaScript/TypeScript, you have to do a bit of arithmetic to find the correct structure entry. For example, using twr-wasm with the above `struct test_struct`, you access the elements like this using JavaScript:

~~~js
const structMem = await mod.callC(["get_test_struct"]);
const structIndexA = 0;
const structIndexB = 4;
const structIndexC = 8;
const valA = mod.getLong(structMem + structIndexA);
const valB = mod.mem8[structMem + structIndexB];
const intValPtr = mod.getLong(structMem + structIndexC);
const intVal = mod.getLong(intValPtr);
~~~

You can see the additional complexity of de-referencing the `int *`.

For an example of allocating a C struct in JavaScript, see this [example](../examples/examples-callc.md/).

## Passing ArrayBuffers from JavaScript to C/C++ WebAssembly

twr-wasm provides helper functions to pass ArrayBuffers to and from C/C++. The technique here is similar to that used for a `struct`, with the following differences:

 - `ArrayBuffers` have entries of all the same length, so no special `struct` entry math is needed.
 - When an `ArrayBuffer` is passed to a function, the function receives a pointer to the `malloc` memory. If the length is not known by the function, the length needs to be passed as a separate parameter.
 - When the C function returns, any modifications made to the memory are reflected back into the `ArrayBuffer`.

Here is an example:

~~~js
let ba = new Uint8Array(4);
ba[0] = 99; ba[1] = 98; ba[2] = 97; ba[3] = 6;
const ret_sum = await mod.callC(["param_bytearray", ba.buffer, ba.length]);
~~~

See this [example](../examples/examples-callc.md/) for the complete example.

## Summary

I hope this has demystified how JavaScript values are passed to and from WebAssembly, using libraries like Emscripten and twr-wasm.

