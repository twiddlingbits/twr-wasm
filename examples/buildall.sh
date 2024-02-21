#!/bin/bash

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
make="mingw32-make"
else
make="make"
fi

cd helloworld
$make clean
$make 

cd ../stdio-div
$make  clean
$make  

cd ../stdio-canvas
$make  clean
$make 

cd ../function-calls
$make  clean
$make  PUBLIC_URL='/function-calls/dist'

cd ../maze
$make  clean
$make 



