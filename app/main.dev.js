/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

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
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';

import MenuBuilder from './menu';

const { openProcessManager } = require('electron-process-manager');

let mainWindow = null;
let appAboutToQuit = false;
let creditsWindow = null;
let workerWindow = null;
let opencvWorkerWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

// set log level
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

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
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
  log.debug('window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    backgroundColor: '#1e1e1e',
    show: false,
    width: 1366,
    height: 768
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
  });

  // openProcessManager();

  mainWindow.on('close', event => {
    // only hide window and prevent default if app not quitting
    if (!appAboutToQuit) {
      mainWindow.hide();
      event.preventDefault();
    }
  });

  creditsWindow = new BrowserWindow({
    width: 660,
    height: 660,
    resizable: true,
    title: 'Credits',
    minimizable: false,
    fullscreenable: false
  });
  creditsWindow.hide();
  creditsWindow.loadURL(`file://${__dirname}/credits.html`);

  creditsWindow.on('close', event => {
    // only hide window and prevent default if app not quitting
    if (!appAboutToQuit) {
      creditsWindow.hide();
      event.preventDefault();
    }
  });

  workerWindow = new BrowserWindow();
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

  opencvWorkerWindow = new BrowserWindow();
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

  const menuBuilder = new MenuBuilder(
    mainWindow,
    creditsWindow,
    workerWindow,
    opencvWorkerWindow
  );
  menuBuilder.buildMenu();
});

ipcMain.on('reload-workerWindow', (event) => {
  workerWindow.webContents.reload();
});

ipcMain.on('reload-opencvWorkerWindow', (event) => {
  opencvWorkerWindow.webContents.reload();
});

ipcMain.on('request-save-MoviePrint', (event, arg) => {
  workerWindow.webContents.send('action-save-MoviePrint', arg);
});

ipcMain.on(
  'send-save-file',
  (event, id, filePath, buffer, saveMoviePrint = false) => {
    fs.writeFile(filePath, buffer, err => {
      if (err) {
        mainWindow.webContents.send('received-saved-file-error', err.message);
      } else {
        mainWindow.webContents.send('received-saved-file', id, filePath);
      }
      if (saveMoviePrint) {
        workerWindow.webContents.send('action-saved-MoviePrint-done');
      }
    });
  }
);

ipcMain.on('send-save-file-error', (event, saveMoviePrint = false) => {
  mainWindow.webContents.send(
    'received-saved-file-error',
    'MoviePrint could not be saved due to sizelimit (width + size > 32767)'
  );
  if (saveMoviePrint) {
    workerWindow.webContents.send('action-saved-MoviePrint-done');
  }
});

ipcMain.on(
  'message-from-mainWindow-to-workerWindow',
  (e, ipcName, ...args) => {
    log.debug(
      `passing ipc message ${ipcName} from mainWindow to workerWindow`
    );
    log.debug(
      `passing ipc message ${ipcName} from mainWindow to workerWindow`
    );
    // log.debug(...args);
    workerWindow.webContents.send(ipcName, ...args);
  }
);

ipcMain.on(
  'message-from-workerWindow-to-mainWindow',
  (e, ipcName, ...args) => {
    log.debug(
      `passing ipc message ${ipcName} from workerWindow to mainWindow`
    );
    // log.debug(...args);
    mainWindow.webContents.send(ipcName, ...args);
  }
);

ipcMain.on(
  'message-from-mainWindow-to-opencvWorkerWindow',
  (e, ipcName, ...args) => {
    log.debug(
      `passing ipc message ${ipcName} from mainWindow to opencvWorkerWindow`
    );
    // log.debug(...args);
    opencvWorkerWindow.webContents.send(ipcName, ...args);
  }
);

ipcMain.on(
  'message-from-opencvWorkerWindow-to-mainWindow',
  (e, ipcName, ...args) => {
    log.debug(
      `passing ipc message ${ipcName} from opencvWorkerWindow to mainWindow`
    );
    // log.debug(...args);
    mainWindow.webContents.send(ipcName, ...args);
  }
);

// // retransmit it to workerWindow
// ipcMain.on('printPDF', (event: any, content: any) => {
//   workerWindow.webContents.send('printPDF', content);
// });
// // when worker window is ready
// ipcMain.on('readyToPrintPDF', (event) => {
//   const pdfPath = path.join(os.tmpdir(), 'print.pdf');
//   // Use default printing options
//   setTimeout(() => {
//     workerWindow.webContents.printToPDF({}, (error, data) => {
//       if (error) throw error;
//       fs.writeFile(pdfPath, data, (err) => {
//         if (err) {
//           throw err;
//         }
//         shell.openItem(pdfPath);
//         event.sender.send('wrote-pdf', pdfPath);
//         // workerWindow.webContents.print();
//       });
//     });
//   }, 1000);
// });
