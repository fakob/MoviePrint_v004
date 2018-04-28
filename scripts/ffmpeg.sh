#!/usr/bin/env bash
# ffmpeg_version=3.4.2

mkdir -p app/dist/ffmpeg
cp /usr/local/Cellar/ffmpeg/3.4.2/lib/* app/dist/ffmpeg

FILES=app/node_modules/opencv-build/opencv/build/lib/*.3.4.1.dylib
for f in $FILES
do
  echo "Processing $f file..."
  # take action on each file. $f store current file name
  install_name_tool -delete_rpath @loader_path/../../../../../dist/test $f
done
