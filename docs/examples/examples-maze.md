<h1>Maze - WebAssembly C Example</h1>
This example is a port to wasm of a 20 year old Win32 C program with the help of twr-wasm 2D Draw APIs.

- [View live maze here](/examples/dist/maze/index.html)
- [Source for maze](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/maze)

<img src="../../img/readme-img-maze.png" width="400">

This example (in winemu.c) uses the twr-wasm "d2d" (Draw 2D) APIs.  These allow drawing onto an HTML canvas from C/C++.  See the balls example for a C++ Canvas class.

I have included the TypesScript below.  You can see the C code in the examples/maze folder.

This C is interesting in that it is a combination of blocking and non blocking functions.  The CalcMaze() function is blocking when the "slow draw" flag is set.  It uses Sleep() in this case.   For this reason, I use twrWasmModuleAsync.   The solve section uses repeated calls to SolveStep(), which works well with a JavaScript main loop.  I used a javascript interval timer to make repeated calls to the C SolveStep().  If all the C code was structured this way, twrWasmModule could have been used (instead of the Async version)

To port this code to twr-wasm I wrote a (very tiny) Win32 compatible API.  It only implements the features needed to port maze, but it might be useful to use as a starting point for porting your Win32 code to the web.  In the maze example, the two files are winemu.c and winemu.h.   You use winemu.h to replace windows.h

~~~
<head>
	<title>Maze</title>
</head>
<body style="background-color:powderblue">
	<canvas id="twr_d2dcanvas" width="600" height="600"></canvas>

	<script type="module">
		import {mazeRunner} from "./maze-script.js";
		
		mazeRunner();
	</script>
</body>
~~~
~~~
import {twrWasmModuleAsync} from "twr-wasm";

export async function mazeRunner() {

    const amod=new twrWasmModuleAsync();

    await amod.loadWasm('maze.wasm');
    
    //void CalcMaze(HWND hWnd, LONG cell_size, LONG is_black_bg, LONG isd - slow draw)
    await amod.callC(["CalcMaze", 0, 7, 0, 1]);
    await amod.callC(["SolveBegin"]);

    let timer = setInterval(async ()=>{
        let isdone=await amod.callC(["SolveStep", 0]);  //SolveStep(hwnd))
        if (isdone) clearInterval(timer);
    }, 50);
}
~~~
