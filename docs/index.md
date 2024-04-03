# C/C++ Runtime for Web Assembly
tiny-wasm-runtime is a simple, lightweight and easy to use solution for compiling and running C/C++ in Web Assembly. It solves some common use cases with less work than the more full-featured emscripten. tiny-wasm-runtime is easy to understand, and has some cool features. You can input and print character i/o to `<div>` or `<canvas>` elements, run blocking C/C++, and use Javascript `<canvas>` 2D drawing apis.

tiny-wasm-runtime allows you to run C/C++ code in a web browser. Legacy code,  libraries, full applications, or single functions can be integrated with Javascript and Typescript.

## C++ Bouncing Balls Demo
[View bouncing balls here](/examples/dist/balls/index.html)

## Key Features
   - load web assembly modules, and call their C/C++ functions from JavaScript (with parameter conversion as needed)
   - in C/C++, printf and get characters to/from `<div>` tags in your HTML page
   - in C/C++, printf and get characters to/from a `<canvas>` based "terminal"
   - in C/C++ use 2D drawing API compatible with JavaScript Canvas
   - in C/C++, use the "blocking loop" pattern and integrate with Javascript's asynchronous event loop
   - linked with helloworld,  code+data < 3K

## Why?
[The Wasm Problem](more/wasm-problem.md) section explains why a C/C++  Runtime is needed for Web Assembly.

## Hello World
Here is the simplest tiny-wasm-runtime example.

C code:

~~~
   #include <stdio.h>

   void hello() {
      printf("hello world\n");
   }
~~~

index.html:
~~~
<head>
	<title>Hello World</title>
</head>
<body>
	<div id="twr_iodiv"></div>

	<script type="module">
		import {twrWasmModule} from "tiny-wasm-runtime";
		
		const mod = new twrWasmModule();
		await mod.loadWasm("./helloworld.wasm");
		await mod.callC(["hello"]);
	</script>
</body>
~~~

## View Live Demos

| Name | View Live Link | Source Link |
| --------- | ------------ | ----------- |
| Bouncing Balls (C++) | [View bouncing balls](/examples/dist/balls/index.html) | [Source for balls](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/balls) |
| Maze (Win32 C Port) | [View live maze here](/examples/dist/maze/index.html) | [Source for maze](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/maze) |
| Input from `<div>` | [View square demo](/examples/dist/stdio-div/index.html) | [Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-div) |
|Mini-Terminal from `<canvas>`|[View mini-term demo](/examples/dist/stdio-canvas/index.html)|[Source](https://github.com/twiddlingbits/tiny-wasm-runtime/tree/main/examples/stdio-canvas)|

## On Github
[https://github.com/twiddlingbits/tiny-wasm-runtime](https://github.com/twiddlingbits/tiny-wasm-runtime)

## Version 1.0.0 Limitations 
   - Not all ansi stdlib functions are implemented
   - C++ libc++ (std::) not supported
   - Most string functions use ASCII, not for example, UTF-8
   - Designed to work with a browser.  Not tested with or designed to work with node.js  
   - Not all of compile-rt is ported

## Post Feedback

Please post feedback (it worked for you, didn't work, requests, questions, etc) at [https://github.com/twiddlingbits/tiny-wasm-runtime/](https://github.com/twiddlingbits/tiny-wasm-runtime/)

