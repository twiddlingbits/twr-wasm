#!/bin/bash

# this script builds all the examples but does not bundle them.
# after running this script, examples can be most easily be executed by using the VS Code "Run and Debug" menu
# or use buildbundle.sh to bundle and then execute with a local server (see buildbundle.sh)

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

cd ../tests-user
$make clean
$make 

cd ../tests-libcxx
$make clean
$make 





