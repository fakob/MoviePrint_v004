/* eslint no-inner-declarations: 0 */

import path from 'path';
import log from 'electron-log';

const shell = require('shelljs');

// cross platform variables
const projectRoot = shell.pwd().stdout;

if (process.platform === 'darwin') {

  // Include all opencv dependencies including ffmpeg
  log.info(
    'running opencv script to copy all its dependencies including ffmpeg library files into the opencv folder for later packaging and relink them if necessary'
  );

  function fixDeps(dirPath, dependencyDirName) {
    log.info(`checking all dylib files in ${dirPath}, copy dependencies into ${dependencyDirName} and change the dylib linking`);
    const dylibs = shell.ls(dirPath)
    const allDeps = []
    dylibs
      .filter(file => file.indexOf('dylib') !== -1)
      .forEach(dylibFilename => {
        const dylib = path.join(dirPath, dylibFilename);
        console.log(`checking outer dependencies of file ${dylib}`);
        const outerDeps = shell
          .exec(`otool -l ${dylib} | grep 'name /usr/local'`)
          .stdout.split('\n')
          .filter(dep => dep !== '');

        if (outerDeps.length > 0) {
          shell.exec(`install_name_tool -add_rpath @loader_path/${dependencyDirName}`);
        }
        outerDeps.forEach(depLine => {
          const regex = /name (.+?(?=\ \(offset))/g; // transform "name /usr/lib/libc++.1.dylib (offset 24)" -> "/usr/lib/libc++.1.dylib"
          const depfilePath = regex.exec(depLine)[1]; // "/usr/lib/libc++.1.dylib"
          const depfileName = depfilePath.replace(/^.*[\\\/]/, '');

          if (!allDeps.find(e => e === depfilePath)) {
            // if not added already -> add it
            allDeps.push(depfilePath);
            console.log(`    copying outer dependency ${depfilePath} to ${outerDependencyDir}`);
            shell.cp('-n', depfilePath, outerDependencyDir);
          }
          shell.chmod('-v', '666', dylib);
          const fixCommand = `install_name_tool -change ${depfilePath} @loader_path/${dependencyDirName}/${depfileName} ${dylib}`;
          console.log(`    fix with command: ${fixCommand}`);
          shell.exec(fixCommand);
        })

        console.log(`\n\n`);
      })
    console.info('All outer dependencies:');
    console.log(allDeps);
    return allDeps;
  }

  // osx path variables
  const opencvLibDir = path.resolve(
    projectRoot,
    'app/node_modules/opencv-build/opencv/build/lib/'
  );
  const dependencyDir = 'dependencies'
  const outerDependencyDir = path.join(opencvLibDir, dependencyDir);

  log.debug(`projectRoot: ${projectRoot}`);
  log.debug(`outerDependencyDir: ${outerDependencyDir}`);
  log.debug(`opencvLibDir: ${opencvLibDir}`);

  // create dependencies folder
  shell.mkdir('-p', outerDependencyDir);

  fixDeps(opencvLibDir, dependencyDir);
  fixDeps(outerDependencyDir, '');
  fixDeps(outerDependencyDir, '');
  fixDeps(outerDependencyDir, '');

} else if (process.platform === 'win32') {

  // it seems that on windows opencv is already bundled with ffmpeg

  // // Include all opencv dependencies including ffmpeg
  // log.info(
  //   'running opencv script to copy ffmpeg files into the opencv folder for later packaging'
  // );
  //
  // if (!shell.which('ffmpeg')) {
  //   shell.echo('ffmpeg could not be found and packaged. It is therefore very likely that opencv was built without ffmpeg support. MoviePrint might still work, just without ffmpeg support.');
  //   shell.exit(1);
  // }
  //
  // // get ffmpeg version
  // const ffmpegVersionLine = shell.exec('ffmpeg -version', {silent:true}).grep('ffmpeg version');
  // const regex = /ffmpeg version (\d+\.\d+\.\d)/g;
  // const ffmpegVersion = regex.exec(ffmpegVersionLine)[1];
  // log.debug(`trying to package ffmpeg version: ${ffmpegVersion}`);
  //
  // // get ffmpeg folder where ffmpeg.exe, (ffplay.exe and ffprobe.exe) are installed
  // const ffmpegSource = shell.exec('powershell where.exe ffmpeg').stdout;
  // log.debug(ffmpegSource);
  //
  // let ffmpegSourceDir;
  // if (ffmpegSource.indexOf('scoop') >= 0) {
  //   // if installed with scoop then hardcode path as this does not support shims
  //   ffmpegSourceDir = path.resolve(
  //     process.env.HOME || process.env.USERPROFILE,
  //     'scoop\\apps\\ffmpeg\\current\\bin'
  //   );
  //   log.debug(ffmpegSourceDir);
  // } else {
  //   ffmpegSourceDir = path.dirname(ffmpegSource);
  //   log.debug(ffmpegSourceDir);
  // }
  //
  // const opencvLibDir = path.resolve(
  //   projectRoot,
  //   'app/node_modules/opencv-build/opencv/build/bin/Release/'
  // );
  //
  // // copy ffmpeg files
  // shell.cp('-n', path.join(ffmpegSourceDir, 'ffmpeg.exe'), opencvLibDir);
}
