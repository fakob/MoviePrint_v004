import log from 'electron-log';

const { ipcMain } = require('electron');

export const clearCache = (win) => {
  log.debug('clearCache');
  win.webContents.session.getCacheSize((cacheSizeBefore) => {
    log.debug(`cacheSize before: ${cacheSizeBefore}`);
    // clear HTTP cache
    win.webContents.session.clearCache(() => {
      // then clear data of web storages
      win.webContents.session.clearStorageData(() => {
        // then print cacheSize
        win.webContents.session.getCacheSize((cacheSizeAfter) => {
          log.debug(`cacheSize after: ${cacheSizeAfter}`);
          // and reload to use initialStateJSON
          win.webContents.reload();
        });
      });
    });
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
  // ipcMain.on('delete-all-tables-done', () => {
  //   clearCache(mainWindow);
  //   workerWindow.webContents.reload();
  //   opencvWorkerWindow.webContents.reload();
  //   indexedDBWorkerWindow.webContents.reload(); // needs reload to open indexedDB connection
  // });
}

export const reloadApplication = (mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow) => {
  mainWindow.webContents.reload();
  workerWindow.webContents.reload();
  opencvWorkerWindow.webContents.reload();
  indexedDBWorkerWindow.webContents.reload();
}
