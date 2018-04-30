#!/usr/bin/env bash

# as the dist folder is not synced on github, we copy files into it before packaging

# variables
moviePrintDir=$PWD"/"
distDir=$moviePrintDir"app/dist/"
resourcesDir=$moviePrintDir"resources/"

# copy files
cp -nfv $resourcesDir"font/Franchise-Bold.woff" $distDir
