#!/usr/bin/env bash
# ffmpeg_version=3.4.2

# variables
moviePrintDir=$PWD"/"
ffmpegDir=$moviePrintDir"app/dist/ffmpeg/"
ffmpegFiles=$ffmpegDir"*.dylib"
opencvLibDir=$moviePrintDir"app/node_modules/opencv-build/opencv/build/lib/"
libopencv_videoioFile=$opencvLibDir"libopencv_videoio.dylib"
libavcodecFile=$ffmpegDir"libavcodec.dylib"

# create ffmpeg folder and copy files
mkdir -p $ffmpegDir
cp -nv /usr/local/Cellar/ffmpeg/3.4.2/lib/* $ffmpegDir

# for libopencv_videoio add rpath and change the absolute ffmpeg paths to use rpath
install_name_tool -add_rpath @loader_path/../../../../../dist/ffmpeg $libopencv_videoioFile
install_name_tool -change /usr/local/opt/ffmpeg/lib/libavcodec.57.dylib @rpath/libavcodec.57.dylib $libopencv_videoioFile
install_name_tool -change /usr/local/opt/ffmpeg/lib/libavformat.57.dylib @rpath/libavformat.57.dylib $libopencv_videoioFile
install_name_tool -change /usr/local/opt/ffmpeg/lib/libavutil.55.dylib @rpath/libavutil.55.dylib $libopencv_videoioFile
install_name_tool -change /usr/local/opt/ffmpeg/lib/libswscale.4.dylib @rpath/libswscale.4.dylib $libopencv_videoioFile
install_name_tool -change /usr/local/opt/ffmpeg/lib/libavresample.3.dylib @rpath/libavresample.3.dylib $libopencv_videoioFile

# for ffmpeg files make them writeable and change their absolute paths amongst eachother to use rpath
for f in $ffmpegFiles
do
  if [ -f "$f" ]; then
      echo "Processing $f ..."
      chmod -v 666 $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavfilter.6.dylib @rpath/libavfilter.6.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavresample.3.dylib @rpath/libavresample.3.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libswscale.4.dylib @rpath/libswscale.4.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libpostproc.54.dylib @rpath/libpostproc.54.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavformat.57.dylib @rpath/libavformat.57.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavcodec.57.dylib @rpath/libavcodec.57.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libswresample.2.dylib @rpath/libswresample.2.dylib $f
      install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavutil.55.dylib @rpath/libavutil.55.dylib $f
  fi
done
