#!/bin/bash

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
make="mingw32-make"
else
make="make"
fi

set -e  # exit if any command returns non zero

cd helloworld
$make clean
$make 

cd ../stdio-div
$make clean
$make 

cd ../stdio-canvas
$make  clean
$make  

cd ../function-calls
$make clean
$make 

cd ../maze
$make  clean
$make  

cd ../fft
$make clean
$make 

cd ../balls
$make clean
$make 

cd ../tests
$make clean
$make 





