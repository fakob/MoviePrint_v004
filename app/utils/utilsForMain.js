import log from 'electron-log';
import path from 'path';

export const clearCache = win => {
  log.debug('clearCache');
  win.webContents.session
    .getCacheSize()
    .then(cacheSizeBefore => {
      log.debug(`cacheSize before: ${cacheSizeBefore}`);
      return win.webContents.session.clearCache();
    })
    .then(() => {
      return win.webContents.session.clearStorageData();
    })
    .then(() => {
      return win.webContents.session.getCacheSize();
    })
    .then(cacheSizeAfter => {
      log.debug(`cacheSize after: ${cacheSizeAfter}`);
      // and reload to use initialStateJSON
      win.webContents.reload();
      return undefined;
    })
    .catch(error => {
      log.error(`There has been a problem with your clearCache operation: ${error.message}`);
    });
};

export const resetApplication = (mainWindow, workerWindow, opencvWorkerWindow, databaseWorkerWindow) => {
  mainWindow.webContents.send('delete-all-tables');
  setTimeout(() => {
    clearCache(mainWindow);
    workerWindow.webContents.reload();
    opencvWorkerWindow.webContents.reload();
    databaseWorkerWindow.webContents.reload(); // needs reload to open indexedDB connection
  }, 1000);
};

// soft reset only deletes the indexedDB table, and does not clear cache nor all storage data
// and also does not reload the windows
export const softResetApplication = mainWindow => {
  mainWindow.webContents.send('delete-all-tables');
};

export const reloadApplication = (mainWindow, workerWindow, opencvWorkerWindow, databaseWorkerWindow) => {
  mainWindow.webContents.reload();
  workerWindow.webContents.reload();
  opencvWorkerWindow.webContents.reload();
  databaseWorkerWindow.webContents.reload();
};

export const getPathOfLogFileAndFolder = (processPlatform, appName) => {
  let pathOfLogFolder;
  switch (processPlatform) {
    case 'darwin':
      pathOfLogFolder = path.resolve(process.env.HOME || process.env.USERPROFILE, 'Library/Logs/', `${appName}/`);
      break;
    default:
      pathOfLogFolder = path.resolve(
        process.env.HOME || process.env.USERPROFILE,
        'AppData\\Roaming\\',
        `${appName}`,
        'logs/',
      );
  }
  const pathOfLogFile = path.resolve(pathOfLogFolder, 'main.log');
  return { pathOfLogFile, pathOfLogFolder };
};
