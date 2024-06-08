#!/bin/bash

# This script builds the examples, then re-builds the azure folder, 
# which is where the assets reside for an Azure "static web app".
# requires source, which is on github but not in npm package

set -e  # exit if any command returns non zero

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
make="mingw32-make"
else
sh=""
make="make"
fi

cd ../source/
$make clean
$make

cd ../examples
$sh buildbundle.sh '/examples/dist'

rm -r -f ../azure
mkdir -p ../azure/examples/
mkdir -p ../azure/lib-js/
mkdir -p ../azure/source/twr-ts/

cp -r -f . ../azure/examples
cp -r -f ../lib-js/ ../azure/
cp -r -f ../source/twr-ts/ ../azure/source/

cp root.html ../azure/index.html
cp staticwebapp.config.json ../azure/
cp google2d031eb6720a1297.html ../azure/

cd ../azure/examples/

rm -r -f **/.parcel-cache
rm -r -f .parcel-cache
rm -r -f **/out
rm -r -f **/*.c
rm -r -f **/*.h
rm -r -f **/*.o
rm -r -f **/*.bc
rm -r -f **/*.cpp
rm -r -f **/**/*.py
rm -r -f **/README*
rm -r -f **/package*
rm -r -f package*
rm -r -f **/makefile
rm -r -f **/tsconfig.json
rm *.sh
rm readme.md
rm root.html
rm staticwebapp.config.json 

cd ../../
mkdocs build
cd ..


