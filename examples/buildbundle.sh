#!/bin/bash

# this script builds all the examples, then bundles them into the 'dist' folder
# $1 is an optional path for --public-url
# parcel uses --public-url when a bundle will not be located in the root of the web site
# executing this script with no parameters will create a bundle in the dist folder which
# can be launched locally:
# python server.py
# (note dist below)
# http://localhost:8000/dist/index.html
#
# the $1 parameter is used by buildazure.sh, which locates examples in examples/dist
# 
# NOTE: unbundled won't work if launched using 'python server.py' as above since lib-js is not in the server root 
#       (but unbundled will work using azure server, as azure script puts lib-js in the correct place)
#       (AND I can copy lib-js into examples folder if I really want to test this on localhost)
# NOTE: to launched unbundled, either (a) use azure build, (b) launch chrome with file:// (vscode launch does this)
# NOTE: the reverse is also true -- bundled won't work if launched with a file: URL.

set -e  # exit if any command returns non zero

if [ "$(uname -o)" = "Msys" ]; then
export MSYS_NO_PATHCONV=1
fi

if [ -z "$1" ]; then
    public='/dist'
else
    public=$1
fi

echo --public-url is $public

rm -f -r dist
rm -r -f .parcel-cache

sh buildall.sh

parcel build --no-cache --public-url $public index.html

cp helloworld/*.wasm dist/helloworld/
cp divcon/*.wasm dist/divcon/
cp terminal/*.wasm dist/terminal/
cp callc/*.wasm dist/callc/
cp maze/*.wasm dist/maze/
cp fft/*.wasm dist/fft/
cp balls/*.wasm dist/balls/
cp tests/*.wasm dist/tests/
cp tests-user/*.wasm dist/tests-user/
cp tests-libcxx/*.wasm dist/tests-libcxx/
cp pong/*.wasm dist/pong/
cp multi-io/*.wasm dist/multi-io/

