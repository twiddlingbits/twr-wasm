#!/bin/bash

# This script builds the azure folder, which is where a Azure "static web app" deployment image resides.
# clean rebuilds the source, examples, docs
# copies source so the source loads correctly when using the chrome debugger with the examples

set -e  # exit if any command returns non zero

if [ $(uname -o) = "Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
make="mingw32-make"
else
sh="sh"
make="make"
fi

cd ../source/
$make clean
$make

cd ../examples
$sh buildbundle.sh '/examples/dist'
cd ../scripts


rm -r -f ../azure
mkdir -p ../azure/examples/
mkdir -p ../azure/lib-js/
mkdir -p ../azure/source/twr-ts/

cp -r -f ../examples/ ../azure/
cp -r -f ../lib-js/ ../azure/
cp -r -f ../source/twr-ts/ ../azure/source/

cp root.html ../azure/index.html
cp staticwebapp.config.json ../azure/
cp google2d031eb6720a1297.html ../azure/
cp handsitemap.txt ../azure/
cp robots.txt ../azure/

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

cd ../../
mkdocs build
cd scripts
