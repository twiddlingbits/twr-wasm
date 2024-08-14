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

cd helloworld
$make clean

cd ../divcon
$make clean

cd ../terminal
$make  clean

cd ../multi-io
$make  clean

cd ../callc
$make clean

cd ../maze
$make  clean

cd ../fft
$make clean

cd ../balls
$make clean

cd ../tests
$make clean

cd ../tests-user
$make clean

cd ../tests-libcxx
$make clean

cd ../pong
$make clean

cd ../tests-d2d
$make clean

cd ..






