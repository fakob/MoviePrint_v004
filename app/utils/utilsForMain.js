import log from 'electron-log';

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

export const resetApplication = (mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow) => {
  mainWindow.webContents.send('delete-all-tables');
  setTimeout(() => {
    clearCache(mainWindow);
    workerWindow.webContents.reload();
    opencvWorkerWindow.webContents.reload();
    indexedDBWorkerWindow.webContents.reload(); // needs reload to open indexedDB connection
  }, 1000);
};

// soft reset only deletes the indexedDB table, and does not clear cache nor all storage data
// and also does not reload the windows
export const softResetApplication = mainWindow => {
  mainWindow.webContents.send('delete-all-tables');
};

export const reloadApplication = (mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow) => {
  mainWindow.webContents.reload();
  workerWindow.webContents.reload();
  opencvWorkerWindow.webContents.reload();
  indexedDBWorkerWindow.webContents.reload();
};
