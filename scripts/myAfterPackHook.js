const shell = require('shelljs');

// cross platform variables
exports.default = async function(context) {
  // console.log(context);
  const moviePrintDir = context.appOutDir;
  const platform = context.packager.platform.name;
  console.log(moviePrintDir);
  console.log(platform);
  // log.debug(moviePrintDir);

  if (platform === 'windows') {
    // copy missing c++ redistributable file
    shell.cp('-n', 'C:\\Windows\\system32\\CONCRT140.dll', moviePrintDir);
  }
};
