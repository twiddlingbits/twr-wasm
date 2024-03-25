#!/bin/bash

# This script builds the examples and then copies them to the azure folder, 
# which is where the assets reside for an Azure "static web app".

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
else
sh=""
fi

$sh buildforazure.sh

rm -r -f ../azure
mkdir -p ../azure/examples/
mkdir -p ../azure/lib-js/
mkdir -p ../azure/source/twr-wasm-ts/
mkdir -p ../azure/source/whatkey/

cp -r -f . ../azure/examples
cp -r -f ../lib-js/ ../azure/
cp -r -f ../source/whatkey/ ../azure/source/whatkey/
cp -r -f ../source/twr-wasm-ts/ ../azure/source/twr-wasm-ts/

cp root.html ../azure/index.html
cp staticwebapp.config.json ../azure/staticwebapp.config.json
cp google2d031eb6720a1297.html ../azure/

cd ../azure/examples/

rm -r -f **/.parcel-cache
rm -r -f **/out
rm -r -f **/*.c
rm -r -f **/*.h
rm -r -f **/*.o
rm -r -f **/*.bc
rm -r -f **/*.cpp
rm -r -f **/**/*.py
rm -r -f **/README*
rm -r -f **/package*
rm -r -f **/makefile
rm -r -f **/tsconfig.json
rm *.sh
rm *.py
rm readme.md
rm root.html
rm staticwebapp.config.json 

