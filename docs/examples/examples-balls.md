<h1>Bouncing Balls - Web Assembly C++ Example</h1>
This example uses Web Assembly, C++, and twr-wasm to bounce balls around your HTML page.  It uses twr-wasm's 2D Draw API and a C++ Canvas class.

* [View bouncing balls](/examples/dist/balls/index.html) 
* [Source for balls](https://github.com/twiddlingbits/twr-wasm/tree/main/examples/balls) 

The bouncing balls example demonstrates

* C++
* Using the twr-wasm draw 2D APIs that match Javascript Canvas APIs.
* A C++ wrapper for the JavaScript Canvas class

This example does not use libc++, which results in smaller code size.   For an example that uses libc++ see [tests-libcxx](examples-libcxx.md).

 <img src="../../img/readme-img-balls.png" width="500">

