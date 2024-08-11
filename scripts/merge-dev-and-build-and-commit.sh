#!/bin/bash

# this script merges dev into main then builds everything then commits all of the code build artifacts
# I use this when dev is ready to go to main
# in dev branch I typically don't commit the build artifacts, but I do in the main branch (which contains only releases)

# this script assumes the version number has been increased!

if [ "$(uname -o)" = "Msys" ]; then
export MSYS_NO_PATHCONV=1
sh="sh"
make="mingw32-make"
else
sh="sh"
make="make"
fi

set -e  # exit if any command returns non zero

git config user.email "ajwood1965@gmail.com"
git config user.name "Anthony"

$sh a-merge-dev-into-main.sh
$sh b-buildazure
$sh c-commit-buld.sh

echo "complete"
