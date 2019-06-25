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
  // but the redistributable files need to be copied into the the apps root folder
  // I did not manage to configure electron-builder to copy the dll's directly
  // therefore this is done in a 2 step process
  // 1. this script copies the dll's into the dist folder
  // 2. electron-builder copies the dll's into the root folder when packaging

  const distDir = path.resolve(projectRoot, 'app/dist/redistributable/');
  shell.mkdir('-p', distDir); // create folder if it does not exist yet

  // copy necessary redistributable files
  shell.cp('-n', '/Windows/system32/CONCRT140.dll',distDir );
  shell.cp('-n', '/Windows/system32/MSVCP140.dll',distDir );
  shell.cp('-n', '/Windows/system32/VCRUNTIME140.dll',distDir );
}
