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

import { IN_OUT_POINT_SEARCH_LENGTH, IN_OUT_POINT_SEARCH_THRESHOLD } from './utils/mainConstants';
import MenuBuilder from './menu';
import VideoCaptureProperties from './utils/videoCaptureProperties';
import { limitRange } from './utils/utilsForMain';

const opencv = require('opencv4nodejs');

const searchLimit = 100; // how long to go forward or backward to find a none-empty frame


let mainWindow = null;
let appAboutToQuit = false;
let creditsWindow = null;
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

const setPosition = (vid, frameNumberToCapture, useRatio) => {
  if (useRatio) {
    const positionRatio = ((frameNumberToCapture) * 1.0) / (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
    // console.log(`using positionRatio: ${positionRatio}`);
    vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, positionRatio);
  } else {
    vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberToCapture);
  }
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
  console.log('window-all-closed');
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

  mainWindow.on('close', (event) => {
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

  creditsWindow.on('close', (event) => {
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

  workerWindow.on('close', (event) => {
    // only hide window and prevent default if app not quitting
    if (!appAboutToQuit) {
      workerWindow.hide();
      event.preventDefault();
    }
  });

  const menuBuilder = new MenuBuilder(mainWindow, creditsWindow, workerWindow);
  menuBuilder.buildMenu();
});

ipcMain.on('request-save-MoviePrint', (event, arg) => {
  workerWindow.webContents.send('action-save-MoviePrint', arg);
});

ipcMain.on('send-save-file', (event, filePath, buffer, saveMoviePrint = false) => {
  fs.writeFile(filePath, buffer, err => {
    if (err) {
      mainWindow.webContents.send('received-saved-file-error', err.message);
    } else {
      mainWindow.webContents.send('received-saved-file', filePath);
    }
    if (saveMoviePrint) {
      workerWindow.webContents.send('action-saved-MoviePrint-done');
    }
  });
});

ipcMain.on('send-get-file-details', (event, fileId, filePath, posterFrameId) => {
  console.log(fileId);
  console.log(filePath);
  try {
    const vid = new opencv.VideoCapture(filePath);
    console.log(`width: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH)}`);
    console.log(`height: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT)}`);
    console.log(`FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
    console.log(`codec: ${vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)}`);
    event.sender.send('receive-get-file-details', fileId, filePath, posterFrameId, vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT), vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH), vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT), vid.get(VideoCaptureProperties.CAP_PROP_FPS), vid.get(VideoCaptureProperties.CAP_PROP_FOURCC));
  } catch (e) {
    event.sender.send('failed-to-open-file', fileId);
    event.sender.send('progressMessage', fileId, 'error', `Failed to open ${filePath}`, 3000);
    console.log(e);
  }
});

ipcMain.on('send-get-poster-frame', (event, fileId, filePath, posterFrameId) => {
  console.log('send-get-poster-frame');
  console.log(fileId);
  console.log(filePath);
  const vid = new opencv.VideoCapture(filePath);

  const frameNumberToCapture = Math.floor(vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2); // capture frame in the middle
  vid.readAsync((err1, mat1) => {
    const read = function read() {

      setPosition(vid, frameNumberToCapture, false);
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
          event.sender.send('receive-get-poster-frame', fileId, filePath, posterFrameId, outBase64, vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES), useRatio);
        }
        // iterator += 1;
        // if (iterator < frameNumberArray.length) {
        //   read();
        // }
      });
    };

    if (err1) throw err1;
    // let iterator = 0;
    setPosition(vid, frameNumberToCapture, false);
    read();
  });
});

ipcMain.on('send-get-in-and-outpoint', (event, fileId, filePath, useRatio, detectInOutPoint) => {
  console.log('send-get-in-and-outpoint');
  console.log(fileId);
  console.log(filePath);
  console.time(`${fileId}-inPointDetection`);
  const vid = new opencv.VideoCapture(filePath);
  const videoLength = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1;

  if (detectInOutPoint) {
    console.time(`${fileId}-inOutPointDetection`);
    const timeBeforeInOutPointDetection = Date.now();

    event.sender.send('progressMessage', fileId, 'info', 'Detecting in and outpoint');

    const searchLength = Math.min(IN_OUT_POINT_SEARCH_LENGTH, videoLength / 2);
    const threshold = IN_OUT_POINT_SEARCH_THRESHOLD;

    let searchInpoint = true;
    const meanArrayIn = [];
    const meanArrayOut = [];
    let fadeInPoint;
    let fadeOutPoint;

    vid.readAsync((err1) => {
      const read = () => {
        vid.readAsync((err, mat) => {
          const frame = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES);
          console.log(`readAsync: frame:${frame} (${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);
          let frameMean = 0;
          if (mat.empty === false) {
            // console.time('meanCalculation');
            // scale to quarter of size, convert to HSV, calculate mean, get only V channel
            frameMean = mat.rescale(0.25).cvtColor(opencv.COLOR_BGR2HSV).mean().y;
            // console.timeEnd('meanCalculation');

            // // single axis for 1D hist
            // const binCount = 17;
            // const getHistAxis = channel => ([
            //   {
            //     channel,
            //     bins: binCount,
            //     ranges: [0, 256]
            //   }
            // ]);
            // const matHSV = mat.cvtColor(opencv.COLOR_BGR2HSV);
            // const frameHist = opencv.calcHist(matHSV, getHistAxis(2));
            // console.log(frameHist.at(0));
            // console.log(frameHist.at(0) > (binCount * 256));

            if (searchInpoint) {
              meanArrayIn.push({
                frame: vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                mean: frameMean
              });
            } else {
              meanArrayOut.push({
                frame: vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                mean: frameMean
              });
            }

            if ((searchInpoint && (frameMean >= threshold)) ||
              ((frame >= searchLength) && (frame < (videoLength - searchLength)))) {
              // only run if still searching inpoint and frameMean over threshold or done scanning inpoint
              searchInpoint = false; // done searching inPoint
              console.log('resetting playhead');
              setPosition(vid, (videoLength - searchLength), useRatio);
              read();
            } else if ((frame < searchLength) || ((frame >= (videoLength - searchLength)) && (frame <= videoLength))) {
              // half the amount of ipc events
              if (iterator % 2) {
                const progressBarPercentage = ((iterator / (searchLength * 2)) * 100);
                event.sender.send('progress', fileId, progressBarPercentage); // first half of progress
              }
              iterator += 1;
              read();
            }
          } else {
            console.error(`empty frame: iterator:${iterator} frame:${frame} (${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);
          }
          if (frame > videoLength || mat.empty === true) {
            const meanArrayInReduced = meanArrayIn.reduce((prev, current) => {
              let largerObject = ((prev.mean > current.mean) ? prev : current);
              if (prev.frameThreshold === undefined) {
                largerObject = ((current.mean > threshold) ?
                  { ...largerObject, ...{ frameThreshold: current.frame } } : largerObject);
              } else {
                largerObject = { ...largerObject, ...{ frameThreshold: prev.frameThreshold } };
              }
              return largerObject;
            }, { frame: 0, mean: 0 });
            const meanArrayOutReduced = meanArrayOut.reduceRight((prev, current) => {
              let largerObject = ((prev.mean > current.mean) ? prev : current);
              if (prev.frameThreshold === undefined) {
                largerObject = ((current.mean > threshold) ?
                  { ...largerObject, ...{ frameThreshold: current.frame } } : largerObject);
              } else {
                largerObject = { ...largerObject, ...{ frameThreshold: prev.frameThreshold } };
              }
              return largerObject;
            }, { frame: videoLength, mean: 0 });
            console.log(meanArrayInReduced);
            console.log(meanArrayOutReduced);

            // use frame when threshold is reached and if undefined use frame with highest mean
            fadeInPoint = (meanArrayInReduced.frameThreshold !== undefined) ?
              meanArrayInReduced.frameThreshold : meanArrayInReduced.frame;
            fadeOutPoint = (meanArrayOutReduced.frameThreshold !== undefined) ?
              meanArrayOutReduced.frameThreshold : meanArrayOutReduced.frame;

            const timeAfterInOutPointDetection = Date.now();
            console.timeEnd(`${fileId}-inOutPointDetection`);
            console.log(`fadeInPoint: ${fadeInPoint}`);
            console.log(`fadeOutPoint: ${fadeOutPoint}`);
            event.sender.send('progress', fileId, 100); // set to full
            event.sender.send('progressMessage', fileId, 'info', `In and Outpoint detection finished - ${timeAfterInOutPointDetection - timeBeforeInOutPointDetection}ms`, 3000);
            event.sender.send('receive-get-in-and-outpoint', fileId, fadeInPoint, fadeOutPoint);
          } else {
            console.error(`something wrong: iterator:${iterator} frame:${frame} (${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`);
          }
        });
      };

      const startFrame = 0;
      let iterator = 0;
      if (err1) throw err1;
      setPosition(vid, startFrame, useRatio);
      read(); // start reading frames
    });
  } else {
    console.log('in-out-point-detection DEACTIVATED');
    event.sender.send('receive-get-in-and-outpoint', fileId, 0, videoLength);
  }
});

ipcMain.on('send-get-thumbs', (event, fileId, filePath, thumbIdArray, frameIdArray, frameNumberArray, useRatio) => {
  console.log('send-get-thumbs');
  console.log(filePath);
  console.log(`useRatio: ${useRatio}`);
  const vid = new opencv.VideoCapture(filePath);

  vid.readAsync((err1) => {
    const read = (frameOffset = 0) => {
      // limit frameNumberToCapture between 0 and movie length
      const frameNumberToCapture = limitRange(
        frameNumberArray[iterator] + frameOffset,
        0,
        (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1)
      );

      setPosition(vid, frameNumberToCapture, useRatio);

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
    setPosition(vid, frameNumberArray[iterator], useRatio);
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
