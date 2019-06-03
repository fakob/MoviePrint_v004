import path from 'path';
import log from 'electron-log';

const shell = require('shelljs');

// cross platform variables
const moviePrintDir = shell.pwd().stdout;
const ffmpegDestDir = path.resolve(moviePrintDir, 'app/dist/ffmpeg/');
const opencvLibDir = path.resolve(
  moviePrintDir,
  'app/node_modules/opencv-build/opencv/build/lib/'
);
log.debug(moviePrintDir);
log.debug(ffmpegDestDir);
log.debug(opencvLibDir);

// create ffmpeg folder
shell.mkdir('-p', ffmpegDestDir);

if (process.platform === 'darwin') {
  // Copying ffmpeg_version=3.4.2 into dist folder and change library linking if necessary
  log.info(
    'running ffmpeg script to copy the ffmpeg library files into the dist folder for later packaging and relink them if necessary'
  );

  // variables
  const libopencvVideoioFile = path.resolve(
    opencvLibDir,
    'libopencv_videoio.dylib'
  );
  const ffmpegSourceDir = '/usr/local/Cellar/';
  // log.debug(ffmpegSourceDir);
  // log.debug(libopencvVideoioFile);

  // copy files
  shell.cp('-n', `${ffmpegSourceDir}ffmpeg/3.4.2/lib/*`, ffmpegDestDir);
  shell.cp('-n', `${ffmpegSourceDir}x264/r2854/lib/*`, ffmpegDestDir);
  shell.cp('-n', `${ffmpegSourceDir}lame/3.100/lib/*`, ffmpegDestDir);
  // shell.cp('-nv', '/usr/local/Cellar/xvid/1.3.5/lib/*', ffmpegDestDir);
  const ffmpegFiles = shell
    .find(ffmpegDestDir)
    .filter(file => file.match(/\.dylib$/));
  // log.debug(ffmpegFiles);

  // check if install_name_tool is available
  if (!shell.which('install_name_tool')) {
    shell.echo('Sorry, this script requires install_name_tool');
    shell.exit(1);
  }

  // for libopencv_videoio add rpath and change the absolute ffmpeg paths to use rpath
  shell.exec(
    `install_name_tool -add_rpath @loader_path/../../../../../dist/ffmpeg ${libopencvVideoioFile}`
  );
  shell.exec(
    `install_name_tool -change /usr/local/opt/ffmpeg/lib/libavcodec.57.dylib @rpath/libavcodec.57.dylib ${libopencvVideoioFile}`
  );
  shell.exec(
    `install_name_tool -change /usr/local/opt/ffmpeg/lib/libavformat.57.dylib @rpath/libavformat.57.dylib ${libopencvVideoioFile}`
  );
  shell.exec(
    `install_name_tool -change /usr/local/opt/ffmpeg/lib/libavutil.55.dylib @rpath/libavutil.55.dylib ${libopencvVideoioFile}`
  );
  shell.exec(
    `install_name_tool -change /usr/local/opt/ffmpeg/lib/libswscale.4.dylib @rpath/libswscale.4.dylib ${libopencvVideoioFile}`
  );
  shell.exec(
    `install_name_tool -change /usr/local/opt/ffmpeg/lib/libavresample.3.dylib @rpath/libavresample.3.dylib ${libopencvVideoioFile}`
  );

  // for ffmpeg files make them writeable and change their absolute paths amongst eachother to use rpath
  ffmpegFiles.forEach(file => {
    shell.echo(`Processing ${file} ...`);
    shell.chmod('-v', '666', file);
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavfilter.6.dylib @rpath/libavfilter.6.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavresample.3.dylib @rpath/libavresample.3.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libswscale.4.dylib @rpath/libswscale.4.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libpostproc.54.dylib @rpath/libpostproc.54.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavformat.57.dylib @rpath/libavformat.57.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavcodec.57.dylib @rpath/libavcodec.57.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libswresample.2.dylib @rpath/libswresample.2.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/Cellar/ffmpeg/3.4.2/lib/libavutil.55.dylib @rpath/libavutil.55.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/opt/x264/lib/libx264.152.dylib @rpath/libx264.152.dylib ${file}`
    );
    shell.exec(
      `install_name_tool -change /usr/local/opt/lame/lib/libmp3lame.0.dylib @rpath/libmp3lame.0.dylib ${file}`
    );
  });
} else if (process.platform === 'win32') {
  // variables
  const ffmpegSourceDir = path.resolve(
    process.env.HOME || process.env.USERPROFILE,
    'scoop\\apps\\ffmpeg\\'
  );
  log.debug(ffmpegSourceDir);

  // copy ffmpeg files
  shell.cp('-n', path.resolve(ffmpegSourceDir, '3.4.2\\bin\\*'), ffmpegDestDir);

  // copy c++ redistributable file
  shell.cp('-n', 'C:\\Windows\\system32\\CONCRT140.dll', ffmpegDestDir);
}
