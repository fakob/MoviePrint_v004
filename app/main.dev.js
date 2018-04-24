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
import path from 'path';
import fs from 'fs';

import MenuBuilder from './menu';
import VideoCaptureProperties from './utils/videoCaptureProperties';
import { limitRange } from './utils/utilsForMain';

const opencv = require('opencv4nodejs');

const searchLimit = 100; // how long to go forward or backward to find a none-empty frame


let mainWindow = null;
let creditsWindow = null;
// let workerWindow = null;

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
  // mainWindow.webContents.on('did-finish-load', () => {
  //   if (!mainWindow) {
  //     throw new Error('"mainWindow" is not defined');
  //   }
  //   mainWindow.show();
  //   mainWindow.focus();
  // });

  mainWindow.on('closed', () => {
    mainWindow = null;
    creditsWindow = null;
    // workerWindow = null;
  });

  creditsWindow = new BrowserWindow({
    height: 185,
    resizable: false,
    width: 270,
    title: 'Credits',
    minimizable: false,
    fullscreenable: false
  });
  creditsWindow.hide();
  creditsWindow.loadURL(`file://${__dirname}/credits.html`);
  creditsWindow.on('closed', () => {
    creditsWindow.hide();
  });

  // workerWindow = new BrowserWindow();
  // // workerWindow.hide();
  // workerWindow.webContents.openDevTools();
  // workerWindow.loadURL(`file://${__dirname}/worker.html`);

  const menuBuilder = new MenuBuilder(mainWindow, creditsWindow);
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

ipcMain.on('send-get-poster-frame', (event, fileId, filePath, posterFrameId, lastItem) => {
  console.log('send-get-poster-frame');
  console.log(fileId);
  console.log(filePath);
  const vid = new opencv.VideoCapture(filePath);

  const frameNumberToCapture = Math.floor(vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2); // capture frame in the middle
  vid.readAsync((err1, mat1) => {
    const read = function read() {

      vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberToCapture);
      vid.readAsync((err, mat) => {
        console.log(`${frameNumberToCapture}/${vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);

        let useRatio = false;
        // frames not match
        if (frameNumberToCapture !== (vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1)) {
          console.log('########################### Playhead not at correct position: set useRatio to TRUE ###########################');
          useRatio = true;
        }

        if (mat.empty === false) {
          const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
          event.sender.send('receive-get-poster-frame', fileId, filePath, posterFrameId, outBase64, vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES), useRatio, lastItem);
        }
        // iterator += 1;
        // if (iterator < frameNumberArray.length) {
        //   read();
        // }
      });
    };

    if (err1) throw err1;
    // let iterator = 0;
    vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberToCapture);
    read();
  });
});

ipcMain.on('send-get-inpoint', (event, fileId, filePath, useRatio) => {
  console.log('send-get-inpoint');
  console.log(fileId);
  console.log(filePath);
  const vid = new opencv.VideoCapture(filePath);
  const searchForward = true;

  const threshold = 15;
  let lastMean = 0; // Mean pixel intensity of the *last* frame we processed.

  vid.readAsync((err1) => {
    const read = (frame = 0) => {
      // limit frameNumberToCapture between 0 and movie length
      const frameNumberToCapture = limitRange(
        frame,
        0,
        (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
      );

      if (useRatio) {
        const positionRatio = ((frameNumberToCapture) * 1.0) / (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
        console.log(`using positionRatio: ${positionRatio}`);
        vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, positionRatio);
      } else {
        vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberToCapture);
      }

      vid.readAsync((err, mat) => {
        console.log(`readAsync: frame: ${frame}, ${frameNumberToCapture}/${vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);

        const frameMean = mat.mean();

        // Detect fade in from black.
        if ((frameMean >= threshold) && (lastMean < threshold)) {
          console.log(`Detected fade in at ${VideoCaptureProperties.CAP_PROP_POS_MSEC} (frame ${VideoCaptureProperties.CAP_PROP_POS_FRAMES}).`);
        } else if ((frameMean < threshold) && (lastMean >= threshold)) { // Detect fade out to black.
          console.log(`Detected fade in at ${VideoCaptureProperties.CAP_PROP_POS_MSEC} (frame ${VideoCaptureProperties.CAP_PROP_POS_FRAMES}).`);
        }

        lastMean = frameMean; // Store current mean to compare in next iteration.
        if (mat.empty === false) {
          console.log('Mat not empty');
          console.log(mat.mean());
          console.log(mat.at(200, 100));
          console.log(`lastMean ${lastMean} (frame ${frame})`);
        }
        // iterator += 1;
        // iterator += 1;
        if (frame < (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)) {
          read(frame + 1);
        }

        // if (mat.empty === false) {
          // const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
          // event.sender.send(
          //   'receive-get-thumbs', fileId, thumbIdArray[iterator], frameIdArray[iterator], outBase64,
          //   vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
          // );
          // iterator += 1;
          // if (iterator < frameNumberArray.length) {
          //   read();
          // }
          // console.log(`Found inpoint: ${frameNumberToCapture}`);
        // } else {
        //   console.log('frame is empty');
          // if (frame < searchLimit) {
          //   if (searchForward) {
          //     console.log('will try to read one frame forward');
          //     read(frame + 1);
          //   } else {
          //     console.log('will try to read one frame backward');
          //     read(frame - 1);
          //   }
          // } else {
          //   if (searchForward) {
          //     console.log('Found no Inpoint');
          //   } else {
          //     console.log('Found no Outpoint');
          //   }
          // }
        // }
      });
    };

    let iterator = 0;
    if (err1) throw err1;
    if (useRatio) {
      // const positionRatio = ((frameNumberArray[iterator]) * 1.0) / (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
      // console.log(`using positionRatio: ${positionRatio}`);
      vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, iterator);
    } else {
      vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, iterator);
    }
    read();
  });
});

ipcMain.on('send-get-thumbs', (event, fileId, filePath, thumbIdArray, frameIdArray, frameNumberArray, useRatio) => {
  console.log('send-get-thumbs');
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
  console.log(`useRatio: ${useRatio}`);

  vid.readAsync((err1) => {
    const read = (frameOffset = 0) => {
      // limit frameNumberToCapture between 0 and movie length
      const frameNumberToCapture = limitRange(
        frameNumberArray[iterator] + frameOffset,
        0,
        (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
      );

      if (useRatio) {
        const positionRatio = ((frameNumberToCapture) * 1.0) / (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
        console.log(`using positionRatio: ${positionRatio}`);
        vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, positionRatio);
      } else {
        vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberToCapture);
      }

      vid.readAsync((err, mat) => {
        console.log(`readAsync: ${iterator}, frameOffset: ${frameOffset}, ${frameNumberToCapture}/${vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);

        if (mat.empty === false) {
          const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
          event.sender.send(
            'receive-get-thumbs', fileId, thumbIdArray[iterator], frameIdArray[iterator], outBase64,
            vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
          );
          iterator += 1;
          if (iterator < frameNumberArray.length) {
            read();
          }
        } else {
          console.log('frame is empty');
          // assumption is that the we might find frames forward or backward which work
          if (Math.abs(frameOffset) < searchLimit) {
            // if frameNumberToCapture is in first halfe of the movie go forward else backward
            if (frameNumberToCapture < (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2)) {
              console.log('will try to read one frame forward');
              read(frameOffset + 1);
            } else {
              console.log('will try to read one frame backward');
              read(frameOffset - 1);
            }
          } else {
            console.log('still empty, will stop and send an empty frame back');
            event.sender.send(
              'receive-get-thumbs', fileId, thumbIdArray[iterator], frameIdArray[iterator], '',
              vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
            );
            iterator += 1;
          }
        }
      });
    };

    if (err1) throw err1;
    let iterator = 0;
    if (useRatio) {
      const positionRatio = ((frameNumberArray[iterator]) * 1.0) / (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
      console.log(`using positionRatio: ${positionRatio}`);
      vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, positionRatio);
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
