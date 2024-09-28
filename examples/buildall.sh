#!/bin/bash

# this script builds all the examples but does not bundle them.
# also re-builds (not clean) twr-wasm source to help ensure it is current
# after running this script, examples can be most easily be executed by using the VS Code "Run and Debug" menu
# or use buildbundle.sh to bundle and then execute with a local server (see buildbundle.sh)

if [ "$(uname -o)" = "Msys" ]; then
export MSYS_NO_PATHCONV=1
make="mingw32-make"
else
make="make"
fi

set -e  # exit if any command returns non zero

# if this script is being run after an npm install there is no source folder
if [ -d "../source/" ]; then
cd ../source/   
$make
cd ../examples
fi

cd helloworld
$make clean
$make 

cd ../divcon
$make clean
$make 

cd ../terminal
$make  clean
$make  

cd ../multi-io
$make  clean
$make  

cd ../callc
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

cd ../tests-user
$make clean
$make 

cd ../tests-libcxx
$make clean
$make 

cd ../pong
$make clean
$make

cd ../tests-d2d
$make clean
$make

cd ../lib
$make clean
$make

cd ../tests-audio
$make clean
$make

cd ../tests-timer
$make clean
$make



