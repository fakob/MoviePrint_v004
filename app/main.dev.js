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
import { app, BrowserWindow, ipcMain, globalShortcut, shell } from 'electron';
// import opencv from 'opencv';
import MenuBuilder from './menu';
import VideoCaptureProperties from './utils/videoCaptureProperties';

const opencv = require('opencv4nodejs');

const path = require('path');
const fs = require('fs');
const os = require('os');


let mainWindow = null;
let workerWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
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
    workerWindow = null;
  });

  // workerWindow = new BrowserWindow();
  // // workerWindow.hide();
  // workerWindow.webContents.openDevTools();
  // workerWindow.loadURL(`file://${__dirname}/worker.html`);

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

ipcMain.on('send-save-file', (event, filePath, buffer) => {
  fs.writeFile(filePath, buffer, err => {
    if (err) {
      event.sender.send('received-saved-file-error', err.message);
    } else {
      event.sender.send('received-saved-file', filePath);
    }
  });
});

ipcMain.on('send-get-file-details', (event, fileId, filePath, posterFrameId, lastItem) => {
  console.log(fileId);
  console.log(filePath);
  const vid = new opencv.VideoCapture(filePath);
  console.log(`width: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH)}`);
  console.log(`height: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT)}`);
  console.log(`FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
  console.log(`codec: ${vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)}`);
  event.sender.send('receive-get-file-details', fileId, filePath, posterFrameId, lastItem, vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT), vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH), vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT), vid.get(VideoCaptureProperties.CAP_PROP_FPS), vid.get(VideoCaptureProperties.CAP_PROP_FOURCC));
});

ipcMain.on('send-get-poster-frame', (event, fileId, filePath, posterFrameId) => {
  console.log(fileId);
  console.log(filePath);
  const vid = new opencv.VideoCapture(filePath);
  // console.log(`width: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH)}`);
  // console.log(`height: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT)}`);
  // console.log(`FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
  // console.log(`codec: ${vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)}`);
  // event.sender.send('receive-get-file-details', fileId, vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT), vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH), vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT), vid.get(VideoCaptureProperties.CAP_PROP_FPS), vid.get(VideoCaptureProperties.CAP_PROP_FOURCC));

  const frameNumberArray = [Math.floor(vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2)]; // only 1 value (middle frame) in array. too lazy to clean up
  vid.readAsync((err1, mat1) => {
    const read = function read() {
      vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberArray[iterator]);
      vid.readAsync((err, mat) => {
        console.log(`counter: ${iterator}, position: ${vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);
        if (mat.empty === false) {
          const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
          event.sender.send('receive-get-poster-frame', fileId, posterFrameId, outBase64, vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES));
        }
        iterator += 1;
        if (iterator < frameNumberArray.length) {
          read();
        }
      });
    };

    if (err1) throw err1;
    let iterator = 0;
    vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberArray[iterator]);
    read();
  });
});

ipcMain.on('send-get-thumbs', (event, fileId, filePath, thumbIdArray, frameIdArray, frameNumberArray, relativeFrameCount) => {
  console.log(fileId);
  console.log(filePath);
  console.log(frameIdArray);
  // opencv.VideoStream(path.resolve(__dirname, './fingers.mov'), function (err, im) {
  // When opening a file, the full path must be passed to opencv
  // const vid = new opencv.VideoCapture(path.resolve(__dirname, './FrameTestMovie_v001.mov'));
  // const vid = new opencv.VideoCapture(path.resolve(__dirname, './FrameTestMovie_v001.mp4'));
  const vid = new opencv.VideoCapture(filePath);
  console.log(`frameCount: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);
  console.log(`width: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH)}`);
  console.log(`height: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT)}`);
  console.log(`FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
  console.log(`codec: ${vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)}`);
  console.log(relativeFrameCount);

  vid.readAsync((err1, mat1) => {
    const read = function read() {
      if (relativeFrameCount) {
        vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, frameNumberArray[iterator]);
      } else {
        vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberArray[iterator]);
      }

      // tried to setPosition again when they are not in sync, but it did not work
      // if (frameNumberArray[iterator] !== vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES)) {
      //   vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberArray[iterator]);
      // }

      vid.readAsync((err, mat) => {
        console.log(`counter:
          ${iterator}, position(set/get):
          ${frameNumberArray[iterator]}/${vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1}(
          ${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);
        if (mat.empty === false) {
          const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
          event.sender.send(
            'receive-get-thumbs', fileId, thumbIdArray[iterator], frameIdArray[iterator], outBase64,
            vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
          );
        } else {
          event.sender.send(
            'receive-get-thumbs', fileId, thumbIdArray[iterator], frameIdArray[iterator], '',
            vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
          );
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
      vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, frameNumberArray[iterator]);
    } else {
      vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberArray[iterator]);
    }
    read();
  });
});

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
