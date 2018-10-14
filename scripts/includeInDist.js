import path from 'path';
import log from 'electron-log';

const shell = require('shelljs');

// as the dist folder is not synced on github, we copy files into it before packaging
log.info('running includeInDist script to copy some files into the dist folder for later packaging');

// set variables
const moviePrintDir = shell.pwd().stdout;
const distDir = path.resolve(moviePrintDir, 'app/dist/');
const resourcesDir = path.resolve(moviePrintDir, 'resources/');
// log.debug(moviePrintDir);
// log.debug(distDir);
// log.debug(resourcesDir);

// copy files
shell.set('-v'); // verbose
shell.mkdir('-p', distDir); // create folder if it does not exist yet
shell.cp('-nf', path.resolve(resourcesDir, 'font/Franchise-Bold.woff'), distDir);
