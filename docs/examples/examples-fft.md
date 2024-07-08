---
title: FFT - Example of using C FFT with HTML/JavaScript
description: Demonstration of calling the KISS FFT C library from JavaScript using WebAssembly and twr-wasm
---

# FFT - Example of using C FFT with HTML/JavaScript
This example is a demo of integrating the popular KISS FFT C library with TypeScript/JavaScript/HTML using WebAssembly.  The FFT C library is compiled into a Wasm (WebAssembly) module using clang, with the help of twr-wasm.   The FFT Wasm module is used by the HTML page to calculate the FFT.  The FFT input and output is drawn to the web page using JavaScript canvas functions.  

The FFT library exposes APIs to process data, and doesn't use stdio.

The FFT APIs use float32 arrays for complex-number input and output data, and a configuration C struct.   In the example I generate the input data by adding a 1K and 5K sine waves, call the kiss FFT API to perform the FFT on the generated sine waves, and then graph the input and output data using a JavaScript Canvas.

- [View example running on the web](/examples/dist/fft/index.html)
- [View example source code](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/fft)

## Screen Grab of Output
<img src="../../img/readme-img-fft.png" width="500" >

## Code
Here is part of the code. The rest can be found [on github](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/fft).

~~~html title="index.html"
<head>
	<title>Fast Fourier transform (FFT)</title>
</head>
<body style="background-color:white">

	<br>

	<div style="font:24px arial">Input Signal</div>
	<canvas id="c-input" width="1024" height="300" style="background-color:lightgray"></canvas>

	<br><br><br>

	<div style="font:24px arial">FFT Output</div>
	<canvas id="c-output" width="1024" height="300" style="background-color:lightgray"></canvas>

	<script type="module">
		import {fftDemo} from "./fft-script.js";
		
		fftDemo();

	</script>
</body>
~~~
~~~js title="fft-script.js"
import {twrWasmModule} from "twr-wasm";

export async function fftDemo() {

    const mod=new twrWasmModule();

    // load the kiss_fft C code as is, unmodified
    await mod.loadWasm('kiss_fft.wasm');

    //  kissFFTData stores and graphs the input and output data
    //  in this example the fft has 1024 bins, and I am using a 48K sampling rate
    let fft=new kissFFTData(1024, 48000);
    fft.genSin(1000)
    fft.addSin(5000)
    fft.graphIn("c-input");

    // see kiss_fft README, but in summary you: (a) alloc config, (b) compute the FFT, (c) free the config
    // kiss_fft_alloc() returns a malloced structure.  Pointers are numbers (index into Wasm module memory) in JS land 
    //
    //kiss_fft_cfg cfg = kiss_fft_alloc( nfft ,is_inverse_fft ,0,0 );
    let cfg:number = await mod.callC(["kiss_fft_alloc", fft.nfft, 0, 0, 0 ]);

    // The FFT input and output data are C arrays of complex numbers.
    // typedef struct {
    //    kiss_fft_scalar r;
    //    kiss_fft_scalar i;
    // } kiss_fft_cpx;
    //
    // /*  default is float */
    // define kiss_fft_scalar float
    
    // So if the FFT data has 1024 bins, then 1024 * 2 floats (r & i) * 4 bytes per float are needed.
    // I use a JS Float32Array view on the ArrayBuffer to access the floats

    // When an arrayBuffer is passed in as an argument to mod.callC,
    // callC will malloc memory in the Wasm module of a size that matches the array buffer, then
    // copy the arraybuffer into the malloc'd memory prior to the function call, 
    // then copy the malloc'd memory contents back into the arrayBuffer post call.
    // The malloc'd memory is free'd post call. 

    // void kiss_fft(kiss_fft_cfg cfg,const kiss_fft_cpx *fin,kiss_fft_cpx *fout);
    await mod.callC(["kiss_fft", cfg, fft.inArrayBuf, fft.outArrayBuf]);

    fft.graphOut("c-output");
            
    await mod.callC(["free", cfg]);      // not much point to this since all the module memory is about to disappear
}
~~~
