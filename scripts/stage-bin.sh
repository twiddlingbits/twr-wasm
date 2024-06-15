#!/bin/bash

# this script stages to git all of the binary build artifacts
# I use this after running make in source, buildbundle.sh, buildazure.sh, and I am ready to create a new release
# in dev branch I typically don't commit the build artifacts, but i do in the main branch (which contains only releases)

if [ $(uname -o)="Msys" ]; then
export MSYS_NO_PATHCONV=1
fi

root=$(git rev-parse --show-toplevel)

echo "git root: " $root

#azure is not in .gitignore, so not needed here
git add -f $root/include
git add -f $root/lib-c
git add -f $root/lib-js
git add -f $root/examples/**/*.js
git add -f $root/examples/**/*.wasm

git restore --staged $root/examples/dist