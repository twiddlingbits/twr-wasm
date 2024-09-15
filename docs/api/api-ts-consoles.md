---
title: TypeScript-JavaScript API to create i/o Consoles
description: twr-wasm provides TypeScript/JavaScript classes to create I/O Consoles.
---


# Console Classes
This section describes the twr-wasm TypeScript/JavaScript classes that you use to create I/O Consoles for character streaming, a terminal, or 2D Canvas Drawing

The classes `twrConsoleDiv`, `twrConsoleTerminal`, `twrConsoleDebug`, and `twrConsoleCanvas` create consoles that enable user i/o. Your C/C++ can direct user interactive i/o to these consoles.  

## Related Console Documentation
- [Console Introduction](../gettingstarted/stdio.md)
- [Console C APIs](../api/api-c-con.md)

## class twrConsoleDebug 
`twrConsoleDebug` streamings characters to the browser debug console.  

C type: `IO_TYPE_CHARWRITE`

There are no constructor parameters.

## class twrConsoleDiv
`twrConsoleDiv` streams character input and output to a div tag .

C type:  `IO_TYPE_CHARREAD` and  `IO_TYPE_CHARWRITE`

The div tag will expand as you add more text (via printf, etc).

You pass a `<div>` element to use to render the Console to to the `twrConsoleDiv` constructor.  For example:
~~~js
<div id="div1" tabindex="0"></div>

<script type="module">
   import {twrWasmModuleAsync, twrConsoleDiv} from "twr-wasm";

   const stream1Element=document.getElementById("div1");

   // adding keyDown events is needed if the console will accept key input
   // don't forget to set "tabindex" in your tag, otherwise it won't get key events
   stream1Element.addEventListener("keydown",(ev)=>{stream1.keyDown(ev)});

   const stream1 = new twrConsoleDiv(stream1Element);
   const mod = new twrWasmModuleAsync( {stdio: stream1} );
   // mod.callC would go here...
</script>
      
~~~

There are constructor options to set the color and font size. You can also set these directly in the HTML for your `<div>` tag. If you wish to change the default font, set the font in the `div` tag with the normal HTML tag options.

~~~js title="twrConsoleDiv constructor options"
constructor(element:HTMLDivElement,  params:IConsoleDivParams)

export interface IConsoleDivParams {
   foreColor?: string,
   backColor?: string,
   fontSize?: number,
}
~~~

## class twrConsoleTerminal
`twrConsoleTerminal` provides streaming and addressable character input and output.  A `<canvas>` tag is used to render into.

C types: `IO_TYPE_CHARREAD`, `IO_TYPE_CHARWRITE`, `IO_TYPE_ADDRESSABLE_DISPLAY`

twrConsoleTerminal is a simple windowed terminal and supports the same streamed output and input features as a does `twrConsoleDiv`, but also supports x,y coordinates, colors, and other features. The window console supports chunky (low res) graphics (each character cell can be used as a 2x3 graphic array). 

The canvas width and height, in pixels, will be set based on your selected font size and the width and height (in characters) of the terminal.  These are passed as constructor options when you instantiate the `twrConsoleTerminal`.

You can use the `putStr` member function on most consoles to print a string to the terminal in JavaScript.

As you add more text (via printf, etc), the `twrConsoleTerminal` will scroll if it becomes full (unlike `twrConsoleDiv`, which expands)

[A list of C functions](../api/api-c-con.md#io-console-functions) that operate on `twrConsoleTerminal` are available.

Here is an example:
~~~js
<body>

   <canvas id="canvas1forterm" tabindex="0"></canvas>

   <script type="module">
      import {twrWasmModuleAsync, twrConsoleTerminal} from "twr-wasm";

      // find the HTML elements that we will use for our console to render into
      const term1Element=document.getElementById("canvas1forterm");

      // adding keyDown events is needed if the console will accept key input
      // don't forget to set "tabindex" in your tag, otherwise it won't get key events
      term1Element.addEventListener("keydown",(ev)=>{term1.keyDown(ev)});

      // create the console
      const term1 = new twrConsoleTerminal(term1Element, {widthInChars: 50, heightInChars: 20});

      const amod = new twrWasmModuleAsync( 
         {io:{
            stdio: debug, stderr: debug, stream1: stream1, stream2: stream2, term1: term1, term2: term2, draw1: draw1, draw2: draw2
         }} );

      // set the input focus so user doesn't have to click
      stream1Element.focus();

      // load the wasm code and call the multi C function
      await amod.loadWasm("./multi-io.wasm");
      await amod.callC(["multi"]);

      // example of using a console in in JavaScript
      stream1.putStr(`Hello stream1 of type ${stream1.getProp("type")} from JavaScript!\n`);

   </script>
</body>
~~~

~~~js title="twrConsoleTerminal constructor options"
constructor (canvasElement:HTMLCanvasElement, params:IConsoleTerminalParams)

// see twrConsoleDiv options elsewhere, which are also supported
export interface IConsoleTerminalParams extends IConsoleDivParams {
   widthInChars?: number,
   heightInChars?: number,
}
~~~

## class twrConsoleCanvas
`twrConsoleCanvas` creates a 2D drawing surface that the Canvas compatible [2d drawing APIs](../api/api-c-d2d.md) can be used with. 

C type: `IO_TYPE_CANVAS2D`.

~~~js
constructor(element:HTMLCanvasElement)
~~~

~~~js title="twrConsoleCanvas Example"
<body>
   canvas id="canvas1for2d"></canvas>

   <script type="module">
      import {twrWasmModule, twrConsoleCanvas} from "twr-wasm";

      // find the HTML elements that we will 
      // use for our console to render into
      const draw1Element=document.getElementById("canvas1for2d");

      // create the console
      const draw1 = new twrConsoleCanvas(draw1Element);

      const mod = new twrWasmModule( {io: {std2d: draw1}  }} );

      // callC here...
   </script>
~~~

