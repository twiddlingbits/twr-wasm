#!/bin/bash

set -e  # exit if any command returns non zero

rm -f -r dist
rm -r -f .parcel-cache

cd helloworld
mingw32-make clean

cd ../stdio-div
mingw32-make clean

cd ../stdio-canvas
mingw32-make clean

cd ../function-calls
mingw32-make clean

cd ../maze
mingw32-make clean

cd ../fft
mingw32-make clean

cd ../balls
mingw32-make clean

cd ../tests
mingw32-make clean

cd ../tests-libcxx
mingw32-make clean



