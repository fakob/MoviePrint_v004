/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import opencv from 'opencv';
import MenuBuilder from './menu';
import base64ArrayBuffer from './utils/base64ArrayBuffer';

const path = require('path');

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1366,
    height: 768
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

ipcMain.on('send-get-poster-thumb', function (event, fileId, filePath, posterThumbId) {
  console.log(fileId);
  console.log(filePath);
  const vid = new opencv.VideoCapture(filePath);
  console.log(`frameCount: ${vid.getFrameCount()}`);
  console.log(`width: ${vid.getWidth()}`);
  console.log(`height: ${vid.getHeight()}`);
  console.log(`FPS: ${vid.getFPS()}`);
  console.log(`codec: ${vid.getFourCC()}`);
  event.sender.send('receive-get-file-details', fileId, vid.getFrameCount(), vid.getWidth(), vid.getHeight(), vid.getFPS(), vid.getFourCC());

  const frameNumberArray = [Math.floor(vid.getFrameCount() / 2)]; // only 1 value (middle frame) in array. too lazy to clean up
  vid.read((err1, mat1) => {
    const read = function read() {
      vid.setPosition(frameNumberArray[iterator]);
      vid.read((err, mat) => {
        console.log(`counter: ${iterator}, position: ${vid.getPosition() - 1}(${vid.getPositionMS()}ms) of ${vid.getFrameCount()}`);
        if (mat.empty() === false) {
          const buff = mat.toBuffer();
          event.sender.send('receive-get-poster-thumb', fileId, posterThumbId, base64ArrayBuffer(buff), vid.getPosition());
        }
        iterator += 1;
        if (iterator < frameNumberArray.length) {
          read();
        }
      });
    };

    if (err1) throw err1;
    let iterator = 0;
    vid.setPosition(frameNumberArray[iterator]);
    read();
  });
});

ipcMain.on('send-get-thumbs', function (event, fileId, filePath, idArray, frameNumberArray, relativeFrameCount) {
  console.log(fileId);
  console.log(filePath);
  console.log(idArray);
  // opencv.VideoStream(path.resolve(__dirname, './fingers.mov'), function (err, im) {
  // When opening a file, the full path must be passed to opencv
  // const vid = new opencv.VideoCapture(path.resolve(__dirname, './FrameTestMovie_v001.mov'));
  // const vid = new opencv.VideoCapture(path.resolve(__dirname, './FrameTestMovie_v001.mp4'));
  const vid = new opencv.VideoCapture(filePath);
  console.log(`frameCount: ${vid.getFrameCount()}`);
  console.log(`width: ${vid.getWidth()}`);
  console.log(`height: ${vid.getHeight()}`);
  console.log(`FPS: ${vid.getFPS()}`);
  console.log(`codec: ${vid.getFourCC()}`);
  console.log(relativeFrameCount);

  vid.read((err1, mat1) => {
    const read = function read() {
      if (relativeFrameCount) {
        vid.setPositionRatio(frameNumberArray[iterator]);
      } else {
        vid.setPosition(frameNumberArray[iterator]);
      }

      // tried to setPosition again when they are not in sync, but it did not work
      // if (frameNumberArray[iterator] !== vid.getPosition()) {
      //   vid.setPosition(frameNumberArray[iterator]);
      // }

      vid.read((err, mat) => {
        console.log(`counter:
          ${iterator}, position(set/get):
          ${frameNumberArray[iterator]}/${vid.getPosition() - 1}(
          ${vid.getPositionMS()}ms) of ${vid.getFrameCount()}`);
        if (mat.empty() === false) {
          const buff = mat.toBuffer();
          event.sender.send('receive-get-thumbs', fileId, idArray[iterator], base64ArrayBuffer(buff), vid.getPosition() - 1);
        } else {
          event.sender.send('receive-get-thumbs', fileId, idArray[iterator], '', vid.getPosition() - 1);
        }
        iterator += 1;
        if (iterator < frameNumberArray.length) {
          read();
        }
      });
    };

    if (err1) throw err1;
    let iterator = 0;
    if (relativeFrameCount) {
      vid.setPositionRatio(frameNumberArray[iterator]);
    } else {
      vid.setPosition(frameNumberArray[iterator]);
    }
    read();
  });
});
