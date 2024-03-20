#!/bin/bash

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
make="mingw32-make"
else
make="make"
fi

cd helloworld
$make clean
$make bundle PUBLIC_URL='/examples/helloworld/dist'

cd ../stdio-div
$make clean
$make bundle PUBLIC_URL='/examples/stdio-div/dist'

cd ../stdio-canvas
$make  clean
$make  bundle PUBLIC_URL='/examples/stdio-canvas/dist'

cd ../function-calls
$make clean
$make bundle PUBLIC_URL='/examples/function-calls/dist'

cd ../maze
$make  clean
$make  bundle PUBLIC_URL='/examples/maze/dist'

cd ../fft
$make clean
$make bundle PUBLIC_URL='/examples/fft/dist'

cd ../balls
$make clean
$make bundle PUBLIC_URL='/examples/balls/dist'

cd ../tests
$make clean
$make bundle PUBLIC_URL='/examples/tests/dist'





