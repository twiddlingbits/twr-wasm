#!/bin/bash

if [ "$(uname -o)" = "Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
make="mingw32-make"
else
sh="sh"
make="make"
fi

set -e  # exit if any command returns non zero

echo "commit the build artifacts to main..."
root=$(git rev-parse --show-toplevel)
echo "git root: " $root

# TODO!! not sure why i need this, need to resolve.
# TODO!! this also prevents other users from correctly running this script
git config user.email "ajwood1965@gmail.com"
git config user.name "Anthony"

#stage binaries & docs & static website
git add -f $root/azure
git add -f $root/include
git add -f $root/lib-c
git add -f $root/lib-js
git add -f $root/examples/**/*.js
git add -f $root/examples/**/*.wasm

# unstage $root/examples/dist that was just been added to the staging area for by above wildcards
# note this does not impact $root/azure/examples/
git restore --staged $root/examples/dist

git config --get user.email
git config --get user.name

git commit -m "add build (code) artifacts to main"

