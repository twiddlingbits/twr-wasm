#!/bin/bash

# This script builds the examples and then copies them to the azure folder, 
# which is where the assets reside for an Azure "static web app".

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
else
sh=""
fi

# $sh buildall.sh

rm -r -f ../azure
mkdir -p ../azure/examples/
mkdir -p ../azure/lib-js/

cp -r -f . ../azure/examples
cp -r -f ../lib-js/ ../azure/

cp root.html ../azure/index.html

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
