---
title: Passing Function Parameters to WebAssembly
description: Learn techniques to transfer data between JavaScript/TypeScript and C/C++ with WebAssembly. We delves a bit “under the covers”.
---

# Passing Function Parameters to WebAssembly

This article describes techniques to transfer data between JavaScript/TypeScript and C/C++ when using WebAssembly. It delves a bit “under the covers” to explain how this works when you use a library like twr-wasm or Emscripten. In this article, I am using twr-wasm for the examples. Emscripten does something similar.

For an example that illustrates the concepts discussed here, see: [the callC example](../examples/examples-callc.md/).

## WebAssembly Virtual Machine Intrinsic Capabilities

The WebAssembly VM (often referred to as a Wasm “Runtime”) is limited to passing numbers between C functions and the Wasm host (I’ll assume that’s JavaScript for this document). In other words, if you are using the most basic WebAssembly capabilities provided by JavaScript, such as `WebAssembly.Module`, `WebAssembly.Instance`, and `instance.exports`, your function calls and return types can only be:

   - Integer 32 or 64 bit
   - Floating point 32 or 64 bit

These correspond to the WebAssembly spec support for: i32, i64, f32, and f64. 

Note that a JavaScript `number` is of type Float 64 (known as a `double` in C/C++.).  If you are storing an integer into a JavaScript `number`, it is converted to a Float 64, and its maximum "integer" precision is significantly less than 64 bits (its about 52 bits, but this is a simplification).  As a result, to use a 64-bit integers with JavaScript the `bigint` type is used. 

When using 32-bit WebAssembly (by far the most common default), and you call a C function from JavaScript without using any “helper” libraries (like twr-wasm), the following parameter types can be passed:

   - Integer 32: JavaScript `number` type is converted to an Integer 32 and passed to C when the C function prototype specifies a `signed or unsigned int`, `long`, `int32_t`, or a pointer type. All of these are 32 bits in length in wasm32.
   - Integer 64: JavaScript `bigint` type is converted to an Integer 64 and passed to C when the C function prototype specifies signed or unsigned `int64_t` (or equivalent).  Attempting to pass a JavaScript `number` to a C `int64_t` will fail with a JavaScript runtime error.
   - Float 32: JavaScript `number` type is converted to a Float 32 when the C function prototype specifies a `float`.
   - Float 64: JavaScript `number` type is passed as a Float 64 when the C function prototype specifies a `double`.
  
The same rules apply to the return types.

## C Structs: JavaScript <--> C

This section shows how to creates a C `struct` in JavaScript, then passes it to a C function, and then read the modified C `struct` in JavaScript.  

Although the techniques described here are explained with a `struct` example, the basic techniques are used with other data types as well (such as strings).  For common data types, like a string, libraries like twr-wasm will handle these details for you automatically.

To create and pass a C `struct` from JavaScript to C, the technique is to call the WebAssembly C `malloc` from JavaScript to allocate WebAssembly memory and then manipulating the memory in JavaScript. One complexity is that each struct entry’s memory address needs to be calculated. And when calculating the WebAssembly Memory indices for the struct entries, C structure padding must be accounted for. 

### struct Entry Padding

Before we delve into the actual code, lets review C struct entry padding.

In clang, if you declare this structure in your C code:

~~~c
struct test_struct {
    int a;
    char b;
    int *c;
};
~~~

 - The first entry, `int a`, will be at offset 0 in memory (from the start of the `struct` in memory).
 - The second entry, `char b`, will be at offset 4 in memory. This is expected since the length of an int is 4 bytes.
 - The third entry, `int *c`, will be at offset 8 in memory, not at offset 5 as you might expect. The compiler adds three bytes of padding to align the pointer to a 4-byte boundary.

This behavior is dependent on your compiler, cpu, and whether you are using 32 or 64-bit architecture. For wasm32 with clang:

 - char is 1 byte aligned
 - short is 2 byte aligned
 - pointers are 4 byte aligned
 - int, long, int32_t are 4 byte aligned
 - double (Float 64) is 8-byte aligned
  
If you are not familiar with structure padding, there are many articles on the web.

Alignment requirements are why twr-wasm `malloc` (and GCC `malloc` for that matter) aligns new memory allocations on an 8-byte boundary.

### Creating a struct in JavaScript

We can create and initialize the above `struct test_struct` like this in JavaScript:

~~~js
const structSize=12;
const structIndexA=0;
const structIndexB=4;
const structIndexC=8;   // compiler allocates pointer on 4 byte boundaries
let structMem=await mod.malloc(structSize);
let intMem=await mod.malloc(4);
mod.setLong(structMem+structIndexA, 1);
mod.mem8[structMem+structIndexB]=2;    // you can access the memory directly with the mem8, mem32, and memD (float64 aka double) byte arrays.
mod.setLong(structMem+structIndexC, intMem);
mod.setLong(intMem, 200000);
~~~

note that:

- `await mod.malloc(structSize)` is a shortcut for: `await mod.callC(["malloc", structSize])`
- `mod.malloc` returns a C pointer as a `number`.  This pointer is also an index into `WebAssembly.Memory` -- which is exposed as the byte array (`Uint8Array`) via `mod.mem8` by twr-wasm.
- When accessing a C `struct` in JavaScript/TypeScript, you have to do a bit of arithmetic to find the correct structure entry.
- The entry `int *c` is a pointer to an `int`.  So a separate `malloc` to hold the `int` is needed. 
- In twr-wasm there is no function like `setLong` to set a byte.  Instead you access the byte array view of the WebAssembly memory with `mod.mem8`.  Functions like `mod.setLong` manipulate this byte array for you.
- As well as `mod.mem8` (Uint8Array), you can also access WebAssembly.Memory directly via `mod.mem32` (Uint32Array), and `mod.memD` (Float64Array).
- The list of functions available to access WebAssembly.Memory can be [found at the end of this page.](../api/api-typescript.md)

### Passing struct to C from JavaScript

Assume we have C code that adds 2 to each entry of the `test_struct`:

~~~C
__attribute__((export_name("do_struct")))
void do_struct(struct test_struct *p) {
	p->a=p->a+2;
	p->b=p->b+2;
	(*p->c)++;
	(*p->c)++;
}
~~~

Once the `struct` has been created in JavaScript, you can call the C function `do_struct` that adds 2 to each entry like this in twr-wasm:

~~~js
await mod.callC(["do_struct", structMem]);  // will add two to each value
~~~

### Accessing returned C struct in JavaScript

You access the returned elements like this using JavaScript:

~~~js
success=mod.getLong(structMem+structIndexA)==3;
success=success && mod.mem8[structMem+structIndexB]==4;
const intValPtr=mod.getLong(structMem+structIndexC);
success=success && intValPtr==intMem;
success=success && mod.getLong(intValPtr)==200002;
~~~

You can see the additional complexity of de-referencing the `int *`.

### Cleanup
You can free the malloced memory like this:

~~~js
await mod.callC(["free", intMem]);    // unlike malloc, there is no short cut for free, yet
await mod.callC(["free", structMem]);
~~~

The complete code for this [example is here](../examples/examples-callc.md/).

## Passing Strings from JavaScript to C/C++ WebAssembly

Although you can use the technique I am about to describe here directly (by writing your own code), it is generally accomplished by using a third-party library such as twr-wasm or Emscripten. These libraries handle the nitty-gritty for you. 

To pass a string from JavaScript/TypeScript to a WebAssembly module, the general approach is to:

   - Allocate memory for the string inside the WebAssembly memory. This is typically done by calling the C `malloc` from JavaScript. `malloc` returns a pointer, which is an index into the WebAssembly Memory.
   - Copy the JavaScript string to this malloc'd Wasm memory. In the case of twr-wasm, this copying also converts the character encoding as necessary, for example, to UTF-8.
   - Pass the malloc'd memory index to your function as an integer (which is accepted as a pointer by C code).


In the case of twr-wasm, the above steps are handled automatically for you by the `callC` function:

~~~js
mod.callC(["my_function", "this is my string"]);  // mod is instance of twrWasmModule
~~~

Under the covers, to pass "this is my string" from JavaScript to the C Web Assembly function, `callC` will execute code like this:

~~~js
// twrWasmModule member function
async putString(sin:string, codePage = codePageUTF8) {
    const ru8 = this.stringToU8(sin, codePage);  // convert a string to UTF8 encoded characters stored in a Uint8Array
    const strIndex = await this.malloc(ru8.length + 1);  // shortcut for: await this.callC(["malloc", ru8.length + 1]);
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

The `retStringPtr` is an integer 32 (but converted to a JavaScript `number`, which is Float 64). This integer is an index into the WebAssembly Memory.

## Passing ArrayBuffers from JavaScript to C/C++ WebAssembly
When `callC` in twr-wasm is used to pass an ArrayBuffer to and from C/C++, some details are handled for you. The technique is similar to that used for a `string` or as performed manually for a `struct` above, with the following differences:

 - `ArrayBuffers` have entries of all the same length, so the index math is straight forward and now `struct` padding is needed.
 - When an `ArrayBuffer` is passed to a function, the function receives a pointer to the `malloc` memory. If the length is not known by the function, the length needs to be passed as a separate parameter.
 - Before `callC` returns, any modifications made to the memory by the C code are reflected back into the `ArrayBuffer`.
 - the malloced copy of the ArrayBuffer is freed.

Here is an example:

~~~js
let ba = new Uint8Array(4);
ba[0] = 99; ba[1] = 98; ba[2] = 97; ba[3] = 6;
const ret_sum = await mod.callC(["param_bytearray", ba.buffer, ba.length]);
~~~

See this [example](../examples/examples-callc.md/) for the complete example.

## Passing a JavaScript Object to WebAssembly
### Simple Case - use C struct
For a simple object like this:
~~~js
const a = 'foo';
const b = 42;

const obj = {
  a: a,
  b: b
};
~~~

It is straightforward to convert to a C struct like this:
~~~c
struct obj {
	const char* a;
	int b;
};
~~~
To pass this JavaScript object to WebAssembly, a C struct is created (using the `struct` techniques described above).  Each object entry is then copied into the corresponding C `struct` entry (using the `struct` and string techniques described above).

### More Complicated Object
A JavaScript object can contain entries that are of more complexity than simple C data types.  For example:

~~~js
const a = 'foo';
const b = 42;
const map = new Map();
map1.set('a', 1);
map1.set('b', 2);
map1.set('c', 3);
const object2 = { a: a, b: b, c: map };
~~~

In this case, you are going to have to do more work.  An approach is to use the libc++ `map` class, which is similar to the JavaScript `Map`.  You could also perhaps use the libc++ `vector`.  

To handle this more complicated JavaScript object with a `Map` entry, an approach is to export functions from WebAssembly to create and add entries to the libc++ `map` (you need to use `extern 'C'` to export these C++ access functions as C functions).  In otherworld, you might export from your Wasm Module C functions like this:

~~~
void* createMap();   // return an unsigned long Map ID
void addIntToMap(void* mapID, int newInt);
~~~

You would then use these functions in JavaScript to build your C++ `map`.  JavaScript would access this `map` using the `unsigned long` identifier (the `void *` returned by `createMap`).  After creating and adding entries to the `map`, you would set this MapID to `object2.c`.

There are alternative approaches.  For example, you could convert the JavaScript `Map` to a C struct, by enumerating every entry in the `Map`.  Your C struct might look like:
`
~~~c
struct entry {
	char* name;
	int value;
};

struct mapUnroll {
	int MapLen;
	struct entry* entries[];
};
~~~

This approach is probably even more work, less general purpose, and less efficient.

## Summary

I hope this has demystified how JavaScript values are passed to and from WebAssembly.  In many cases, functions like twr-wasm's `mod.callC` will handle the work for you.  But in more bespoke cases, you will have to handle some of the work yourself.

