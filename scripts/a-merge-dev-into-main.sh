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

# merge dev into main
echo "merge dev into main..."
git checkout main  
git pull origin                
git merge --no-ff dev
