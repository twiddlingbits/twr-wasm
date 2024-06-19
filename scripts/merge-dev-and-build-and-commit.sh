#!/bin/bash

# this script merges dev into main then builds everything then commits all of the code build artifacts
# I use this when dev is ready to go to main
# in dev branch I typically don't commit the build artifacts, but I do in the main branch (which contains only releases)

# this script assumes the version number has been increased!

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
make="mingw32-make"
else
sh=""
make="make"
fi

set -e  # exit if any command returns non zero

root=$(git rev-parse --show-toplevel)

echo "git root: " $root

# merge dev into main
echo "merge dev into main..."
git checkout main  
git pull origin                
git merge --no-ff dev

echo "build everything..."
cd ../source/
$make clean
$make
cd ../scripts/

# build binaries & docs & static website
$sh buildazure.sh

echo "commit the build artifacts to main..."
#stage binaries & docs & static website
git add -f $root/azure
git add -f $root/include
git add -f $root/lib-c
git add -f $root/lib-js
git add -f $root/examples/**/*.js
git add -f $root/examples/**/*.wasm
# unstage changes that have been added to the staging area for $root/examples/dist
git restore --staged $root/examples/dist

git commit -m "add build (code) artifacts to main"

echo "complete"
