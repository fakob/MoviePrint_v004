/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import { clearCache, resetApplication, reloadApplication, softResetApplication } from './utils/utilsForMain';

import MenuBuilder from './menu';

const { openProcessManager } = require('electron-process-manager');

let mainWindow = null;
let workerWindow = null;
let opencvWorkerWindow = null;
let indexedDBWorkerWindow = null;

let appAboutToQuit = false;

log.info(process.versions);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true' ||
  process.argv.findIndex(value => value === '--debug') > -1
) {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

// set log level to 'debug' when launched in debug mode
if (process.argv.findIndex(value => value === '--debug') > -1) {
  log.transports.file.level = 'debug';
  log.transports.console.level = 'debug';
}

// set log level from environment variable
const { LOG_LEVEL } = process.env;
// only change the log level if there is an environment variable
// otherwise keep the default ('warn')
if (LOG_LEVEL) {
  log.transports.file.level = LOG_LEVEL;
  log.transports.console.level = LOG_LEVEL;
}

// set log format
log.transports.console.format = '{level} | {h}:{i}:{s}:{ms} {text}';

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload))).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('before-quit', () => {
  // set variable so windows know that they should close and not hide
  appAboutToQuit = true;
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  log.debug('mainThread | window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    backgroundColor: '#1e1e1e',
    show: false,
    width: 1366,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();

    // clear cache if started with --reset arg
    if (process.argv.findIndex(value => value === '--reset') > -1) {
      setTimeout(() => {
        log.info('resetApplication via --reset');
        resetApplication(mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow);
      }, 1000);
    }

    // clear cache if started with --softreset arg
    if (process.argv.findIndex(value => value === '--softreset') > -1) {
      softResetApplication(mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow);
    }
  });

  // openProcessManager();

  mainWindow.on('close', event => {
    if (process.platform !== 'darwin') {
      app.quit();
    } else if (!appAboutToQuit) {
      // only hide window and prevent default if app not quitting
      mainWindow.hide();
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('crashed', event => {
    log.error('mainThread | mainWindow just crashed, will try to reload window');
    log.error(event);
    mainWindow.webContents.reload();
  });

  mainWindow.webContents.on('unresponsive', event => {
    log.warn('mainThread | mainWindow is unresponsive');
    log.warn(event);
  });

  mainWindow.webContents.on('responsive', event => {
    log.warn('mainThread | mainWindow is responsive again');
    log.warn(event);
  });

  opencvWorkerWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  opencvWorkerWindow.hide();
  // opencvWorkerWindow.webContents.openDevTools();
  opencvWorkerWindow.loadURL(`file://${__dirname}/worker_opencv.html`);

  opencvWorkerWindow.on('close', event => {
    // only hide window and prevent default if app not quitting
    if (!appAboutToQuit) {
      opencvWorkerWindow.hide();
      event.preventDefault();
    }
  });

  opencvWorkerWindow.webContents.on('crashed', event => {
    log.error('mainThread | opencvWorkerWindow just crashed, will try to reload window');
    log.error(event);
    opencvWorkerWindow.webContents.reload();
  });

  opencvWorkerWindow.webContents.on('unresponsive', event => {
    log.warn('mainThread | opencvWorkerWindow is unresponsive');
    log.warn(event);
  });

  opencvWorkerWindow.webContents.on('responsive', event => {
    log.warn('mainThread | opencvWorkerWindow is responsive again');
    log.warn(event);
  });

  indexedDBWorkerWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  indexedDBWorkerWindow.hide();
  // indexedDBWorkerWindow.webContents.openDevTools();
  indexedDBWorkerWindow.loadURL(`file://${__dirname}/worker_indexedDB.html`);

  indexedDBWorkerWindow.on('close', event => {
    // only hide window and prevent default if app not quitting
    if (!appAboutToQuit) {
      indexedDBWorkerWindow.hide();
      event.preventDefault();
    }
  });

  indexedDBWorkerWindow.webContents.on('crashed', event => {
    log.error('mainThread | indexedDBWorkerWindow just crashed, will try to reload window');
    log.error(event);
    indexedDBWorkerWindow.webContents.reload();
  });

  indexedDBWorkerWindow.webContents.on('unresponsive', event => {
    log.warn('mainThread | indexedDBWorkerWindow is unresponsive');
    log.warn(event);
  });

  indexedDBWorkerWindow.webContents.on('responsive', event => {
    log.warn('mainThread | indexedDBWorkerWindow is responsive again');
    log.warn(event);
  });

  workerWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  workerWindow.hide();
  // workerWindow.webContents.openDevTools();
  workerWindow.loadURL(`file://${__dirname}/worker.html`);

  workerWindow.on('close', event => {
    // only hide window and prevent default if app not quitting
    if (!appAboutToQuit) {
      workerWindow.hide();
      event.preventDefault();
    }
  });

  workerWindow.webContents.on('crashed', event => {
    log.error('mainThread | workerWindow just crashed, will try to reload window');
    log.error(event);
    workerWindow.webContents.reload();
  });

  workerWindow.webContents.on('unresponsive', event => {
    log.warn('mainThread | workerWindow is unresponsive');
    log.warn(event);
  });

  workerWindow.webContents.on('responsive', event => {
    log.warn('mainThread | workerWindow is responsive again');
    log.warn(event);
  });

  const menuBuilder = new MenuBuilder(
    mainWindow,
    workerWindow,
    opencvWorkerWindow,
    indexedDBWorkerWindow,
  );
  menuBuilder.buildMenu();
});

ipcMain.on('reset-application', event => {
  log.info('resetApplication');
  resetApplication(mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow);
});

ipcMain.on('soft-reset-application', event => {
  log.info('softResetApplication');
  softResetApplication(mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow);
});

ipcMain.on('reload-application', event => {
  log.info('reloadApplication');
  reloadApplication(mainWindow, workerWindow, opencvWorkerWindow, indexedDBWorkerWindow);
});

ipcMain.on('reload-workerWindow', event => {
  workerWindow.webContents.reload();
});

ipcMain.on('reload-opencvWorkerWindow', event => {
  opencvWorkerWindow.webContents.reload();
});

ipcMain.on('reload-indexedDBWorkerWindow', event => {
  indexedDBWorkerWindow.webContents.reload();
});

ipcMain.on('request-save-MoviePrint', (event, arg) => {
  workerWindow.webContents.send('action-save-MoviePrint', arg);
});

ipcMain.on('send-save-json-to-file', (event, id, filePath, json) => {
  fs.writeFile(filePath, json, err => {
    if (err) {
      mainWindow.webContents.send('received-saved-file-error', err.message);
    } else {
      // mainWindow.webContents.send('received-saved-file', id, filePath);
      log.debug(`MoviePrint JSON exported successfully: ${filePath}`);
      mainWindow.webContents.send(
        'progressMessage',
        'info',
        `MoviePrint JSON exported successfully: ${filePath}`,
        3000,
      );
    }
  });
});

ipcMain.on('send-save-file', (event, id, filePath, buffer) => {
  // only used when saving thumbs. writeFile for moviePrint is done in saveMoviePrint (workerWindow)
  fs.writeFile(filePath, buffer, err => {
    if (err) {
      console.log(err);
      mainWindow.webContents.send('received-saved-file-error', err.message);
    } else {
      mainWindow.webContents.send('received-saved-file', id, filePath);
    }
  });
});

ipcMain.on('send-save-file-error', (event, saveMoviePrint = false) => {
  mainWindow.webContents.send(
    'received-saved-file-error',
    'MoviePrint could not be saved due to sizelimit (width + size > 32767)',
  );
  if (saveMoviePrint) {
    workerWindow.webContents.send('action-saved-MoviePrint-done');
  }
});

ipcMain.on('open-file-explorer', (event, filePath, isFolder = false) => {
  if (isFolder) {
    shell.openItem(filePath);
  } else {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.on('message-from-mainWindow-to-workerWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from mainWindow to workerWindow`);
  log.debug(`mainThread | passing ${ipcName} from mainWindow to workerWindow`);
  // log.debug(...args);
  workerWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-workerWindow-to-mainWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from workerWindow to mainWindow`);
  // log.debug(...args);
  mainWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-workerWindow-to-workerWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from workerWindow to workerWindow`);
  // log.debug(...args);
  workerWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-mainWindow-to-opencvWorkerWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from mainWindow to opencvWorkerWindow`);
  // log.debug(...args);
  opencvWorkerWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-indexedDBWorkerWindow-to-opencvWorkerWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from indexedDBWorkerWindow to opencvWorkerWindow`);
  // log.debug(...args);
  opencvWorkerWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-mainWindow-to-indexedDBWorkerWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from mainWindow to indexedDBWorkerWindow`);
  // log.debug(...args);
  indexedDBWorkerWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-opencvWorkerWindow-to-mainWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from opencvWorkerWindow to mainWindow`);
  // log.debug(...args);
  mainWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-opencvWorkerWindow-to-indexedDBWorkerWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from opencvWorkerWindow to indexedDBWorkerWindow`);
  // log.debug(...args);
  indexedDBWorkerWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-indexedDBWorkerWindow-to-mainWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from indexedDBWorkerWindow to mainWindow`);
  // log.debug(...args);
  mainWindow.webContents.send(ipcName, ...args);
});

ipcMain.on('message-from-mainWindow-to-mainWindow', (e, ipcName, ...args) => {
  log.debug(`mainThread | passing ${ipcName} from mainWindow to mainWindow`);
  // log.debug(...args);
  mainWindow.webContents.send(ipcName, ...args);
});

// // retransmit it to workerWindow
// ipcMain.on('printPDF', (event: any, content: any) => {
//   workerWindow.webContents.send('printPDF', content);
// });
// // when worker window is ready
// ipcMain.on('readyToPrintPDF', event => {
//   const pdfPath = path.join(os.tmpdir(), 'print.pdf');
//   // Use default printing options
//   setTimeout(() => {
//     workerWindow.webContents.printToPDF(
//       {
//         marginsType: 0,
//         printBackground: false,
//         printSelectionOnly: false,
//       },
//       (error, data) => {
//         if (error) throw error;
//         fs.writeFile(pdfPath, data, err => {
//           if (err) {
//             throw err;
//           }
//           shell.openItem(pdfPath);
//           event.sender.send('wrote-pdf', pdfPath);
//           // workerWindow.webContents.print();
//         });
//       },
//     );
//   }, 1000);
// });
