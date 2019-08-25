import React from 'react';
import { render } from 'react-dom';
import log from 'electron-log';
// import FileObject from './utils/fileObject';
import VideoCaptureProperties from './utils/videoCaptureProperties';
import { limitRange, setPosition, fourccToString } from './utils/utils';
import {
  HSVtoRGB,
  recaptureThumbs,
 } from './utils/utilsForOpencv';
import {
  IN_OUT_POINT_SEARCH_LENGTH,
  IN_OUT_POINT_SEARCH_THRESHOLD,
} from './utils/constants';
import {
  insertFrameScanArray,
} from './utils/utilsForSqlite';
import Queue from './utils/queue';

process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = 1;

const opencv = require('opencv4nodejs');
const unhandled = require('electron-unhandled');
// const assert = require('assert');

unhandled();
const searchLimit = 25; // how long to go forward or backward to find a none-empty frame
const { ipcRenderer } = require('electron');

// to cancel file scan
let fileScanRunning = false;

// set up a queue
const sceneQueue = new Queue();

log.debug('I am the opencvWorkerWindow - responsible for capturing the necessary frames from the video using opencv');

window.addEventListener('error', event => {
  log.error(event.error);
  event.preventDefault();
});

window.addEventListener('uncaughtException', event => {
  log.error(event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', event => {
  log.error(event.error);
  event.preventDefault();
});

// handle crashes and kill events
process.on('uncaughtException', err => {
  // log the message and stack trace
  log.error(err);
  // fs.writeFileSync('crash.log', err + "\n" + err.stack);
});

// handle crashes and kill events
process.on('SIGTERM', err => {
  // log the message and stack trace
  log.error(err);
  // fs.writeFileSync('shutdown.log', 'Received SIGTERM signal');
});

// ipcRenderer.on('message-from-mainWindow-to-opencvWorkerWindow', (event, ...args) => {
//   log.debug(...args);
// });

ipcRenderer.on('cancelFileScan', (event, fileId) => {
  log.info('cancelling fileScan');
  fileScanRunning = false;
});

ipcRenderer.on('recapture-frames', (event, files, sheetsByFileId, frameSize, fileId = undefined, onlyReplace = true) => {
  log.debug('opencvWorkerWindow | on recapture frames');
  log.debug(`opencvWorkerWindow | frameSize: ${frameSize}`);

  // if fileId, then only recapture those, else recapture all
  let filteredArray = files;
  if (fileId !== undefined) {
    filteredArray = files.filter(file2 => file2.id === fileId);
  }

  log.debug(filteredArray);
  filteredArray.map(file => {
    log.debug(`opencvWorkerWindow | ${file.path}`);
    log.debug(`opencvWorkerWindow | useRatio: ${file.useRatio}`);
    // iterate through all sheets
    const sheets = sheetsByFileId[file.id];
    if (sheets !== undefined) {
      Object.keys(sheets).map(sheetId => {
        const currentSheetArray = sheets[sheetId].thumbsArray;
        const frameNumberArray = currentSheetArray.map(frame => frame.frameNumber);
        const frameIdArray = currentSheetArray.map(frame => frame.frameId);

        // add posterFrame
        frameIdArray.push(file.posterFrameId);
        frameNumberArray.push(Math.floor(file.frameCount / 2));

        recaptureThumbs(
          frameSize,
          file.id,
          file.path,
          file.useRatio,
          frameIdArray,
          frameNumberArray,
          onlyReplace,
          file.transformObject,
        );
        return true; // finished capturing one sheet
      });
    }
    return true; // finished capturing one file
  });
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'success',
    `Finished recapturing all frames with ${frameSize === 0 ? 'original size' : frameSize}px`,
    3000
  );
});

ipcRenderer.on(
  'send-get-file-details',
  (event, fileId, filePath, posterFrameId, onlyReplace = false, onlyImport = false) => {
    log.debug('opencvWorkerWindow | on send-get-file-details')
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    try {
      const vid = new opencv.VideoCapture(filePath);
      log.debug(
        `opencvWorkerWindow | width: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH)}`
      );
      log.debug(
        `opencvWorkerWindow | height: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT)}`
      );
      log.debug(`opencvWorkerWindow | FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
      log.debug(`opencvWorkerWindow | codec: ${fourccToString(vid.get(VideoCaptureProperties.CAP_PROP_FOURCC))}`);
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'receive-get-file-details',
        fileId,
        filePath,
        posterFrameId,
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT),
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH),
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT),
        vid.get(VideoCaptureProperties.CAP_PROP_FPS),
        fourccToString(vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)),
        onlyReplace,
        onlyImport,
      );
    } catch (e) {
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'failed-to-open-file',
        fileId
      );
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'progressMessage',
        'error',
        `Failed to open ${filePath}`,
        10000
      );
      log.error(e);
    }
  }
);

ipcRenderer.on(
  'send-get-poster-frame',
  (event, fileId, filePath, posterFrameId, onlyReplace = false, onlyImport = false) => {
    log.debug('opencvWorkerWindow | on send-get-poster-frame');
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    try {
      const vid = new opencv.VideoCapture(filePath);

      const frameNumberToCapture = Math.floor(
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2
      ); // capture frame in the middle
      vid.readAsync(err1 => {
        const read = function read() {
          setPosition(vid, frameNumberToCapture, false);
          vid.readAsync((err, mat) => {
            log.debug(
              `opencvWorkerWindow | ${frameNumberToCapture}/${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_FRAMES
              ) - 1}(${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_MSEC
              )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
            );

            let useRatio = false;
            // frames not match
            if (
              frameNumberToCapture !==
              vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
            ) {
              log.info(
                'opencvWorkerWindow | ########################### Playhead not at correct position: set useRatio to TRUE ###########################'
              );
              useRatio = true;
            }

            if (mat.empty === false) {
              const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
              const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES);
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
                'send-base64-frame',
                posterFrameId,
                fileId,
                frameNumber,
                outBase64,
                onlyReplace,
              );
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'receive-get-poster-frame',
                fileId,
                filePath,
                posterFrameId,
                frameNumber,
                useRatio,
                onlyReplace,
                onlyImport,
              );
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
    } catch (e) {
      log.error(e)
    }
  }
);

ipcRenderer.on(
  'send-get-in-and-outpoint',
  (event, fileId, filePath, useRatio, detectInOutPoint) => {
    log.debug('opencvWorkerWindow | on send-get-in-and-outpoint');
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);

    try {
      console.time(`${fileId}-inPointDetection`);
      const vid = new opencv.VideoCapture(filePath);
      const videoLength =
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1;
      // log.debug(videoLength);

      if (detectInOutPoint) {
        console.time(`${fileId}-inOutPointDetection`);
        const timeBeforeInOutPointDetection = Date.now();

        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'progressMessage',
          'info',
          'Detecting in and outpoint'
        );

        const searchLength = Math.min(
          IN_OUT_POINT_SEARCH_LENGTH,
          videoLength / 2
        );
        const threshold = IN_OUT_POINT_SEARCH_THRESHOLD;

        let searchInpoint = true;
        const meanArrayIn = [];
        const meanArrayOut = [];
        let fadeInPoint;
        let fadeOutPoint;

        vid.readAsync(err1 => {
          const read = () => {
            vid.readAsync((err, mat) => {
              const frame = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES);
              log.debug(
                `opencvWorkerWindow | readAsync: frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC
                )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
              );
              let frameMean = 0;
              if (mat.empty === false) {
                // console.time('meanCalculation');
                // scale to quarter of size, convert to HSV, calculate mean, get only V channel
                frameMean = mat
                  .rescale(0.25)
                  .cvtColor(opencv.COLOR_BGR2HSV)
                  .mean().y;
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
                // log.debug(frameHist.at(0));
                // log.debug(frameHist.at(0) > (binCount * 256));

                if (searchInpoint) {
                  meanArrayIn.push({
                    frame:
                      vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                    mean: frameMean
                  });
                } else {
                  meanArrayOut.push({
                    frame:
                      vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                    mean: frameMean
                  });
                }

                if (
                  (searchInpoint && frameMean >= threshold) ||
                  (frame >= searchLength && frame < videoLength - searchLength)
                ) {
                  // only run if still searching inpoint and frameMean over threshold or done scanning inpoint
                  searchInpoint = false; // done searching inPoint
                  log.info('opencvWorkerWindow | resetting playhead');
                  setPosition(vid, videoLength - searchLength, useRatio);
                  read();
                } else if (
                  frame < searchLength ||
                  (frame >= videoLength - searchLength && frame <= videoLength)
                ) {
                  // half the amount of ipc events
                  if (iterator % 2) {
                    const progressBarPercentage =
                      iterator / (searchLength * 2) * 100;
                    ipcRenderer.send(
                      'message-from-opencvWorkerWindow-to-mainWindow',
                      'progress',
                      fileId,
                      progressBarPercentage
                    ); // first half of progress
                  }
                  iterator += 1;
                  read();
                }
              } else {
                log.error(
                  `opencvWorkerWindow | empty frame: iterator:${iterator} frame:${frame} (${vid.get(
                    VideoCaptureProperties.CAP_PROP_POS_MSEC
                  )}ms) of ${vid.get(
                    VideoCaptureProperties.CAP_PROP_FRAME_COUNT
                  )}`
                );
              }
              if (frame > videoLength || mat.empty === true) {
                const meanArrayInReduced = meanArrayIn.reduce(
                  (prev, current) => {
                    let largerObject = prev.mean > current.mean ? prev : current;
                    if (prev.frameThreshold === undefined) {
                      largerObject =
                        current.mean > threshold
                          ? {
                              ...largerObject,
                              ...{ frameThreshold: current.frame }
                            }
                          : largerObject;
                    } else {
                      largerObject = {
                        ...largerObject,
                        ...{ frameThreshold: prev.frameThreshold }
                      };
                    }
                    return largerObject;
                  },
                  { frame: 0, mean: 0 }
                );
                const meanArrayOutReduced = meanArrayOut.reduceRight(
                  (prev, current) => {
                    let largerObject = prev.mean > current.mean ? prev : current;
                    if (prev.frameThreshold === undefined) {
                      largerObject =
                        current.mean > threshold
                          ? {
                              ...largerObject,
                              ...{ frameThreshold: current.frame }
                            }
                          : largerObject;
                    } else {
                      largerObject = {
                        ...largerObject,
                        ...{ frameThreshold: prev.frameThreshold }
                      };
                    }
                    return largerObject;
                  },
                  { frame: videoLength, mean: 0 }
                );
                // log.debug(meanArrayInReduced);
                // log.debug(meanArrayOutReduced);

                // use frame when threshold is reached and if undefined use frame with highest mean
                fadeInPoint =
                  meanArrayInReduced.frameThreshold !== undefined
                    ? meanArrayInReduced.frameThreshold
                    : meanArrayInReduced.frame;
                fadeOutPoint =
                  meanArrayOutReduced.frameThreshold !== undefined
                    ? meanArrayOutReduced.frameThreshold
                    : meanArrayOutReduced.frame;

                const timeAfterInOutPointDetection = Date.now();
                console.timeEnd(`${fileId}-inOutPointDetection`);
                log.debug(`opencvWorkerWindow | fadeInPoint: ${fadeInPoint}`);
                log.debug(`opencvWorkerWindow | fadeOutPoint: ${fadeOutPoint}`);
                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'progress',
                  fileId,
                  100
                ); // set to full
                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'progressMessage',
                  'info',
                  `In and Outpoint detection finished - ${timeAfterInOutPointDetection -
                    timeBeforeInOutPointDetection}ms`,
                  3000
                );
                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'receive-get-in-and-outpoint',
                  fileId,
                  fadeInPoint,
                  fadeOutPoint
                );
              } else {
                log.error(
                  `opencvWorkerWindow | something wrong: frame:${frame} > videoLength:${videoLength} || mat.empty ${
                    mat.empty
                  }`
                );
                // log.debug(meanArrayIn);
                // log.debug(meanArrayOut);
                log.error(
                  `opencvWorkerWindow | something wrong: iterator:${iterator} frame:${frame} (${vid.get(
                    VideoCaptureProperties.CAP_PROP_POS_MSEC
                  )}ms) of ${vid.get(
                    VideoCaptureProperties.CAP_PROP_FRAME_COUNT
                  )}`
                );
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
        log.debug('opencvWorkerWindow | in-out-point-detection DEACTIVATED');
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'receive-get-in-and-outpoint',
          fileId,
          0,
          videoLength
        );
      }
    } catch (e) {
      log.error(e);
    }
  }
);

ipcRenderer.on(
  'send-get-file-scan',
  (
    event,
    fileId,
    filePath,
    useRatio,
    threshold = 20.0,
    sheetId,
    transformObject
  ) => {
    log.debug('opencvWorkerWindow | on send-get-file-scan');
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);

    try {
      fileScanRunning = true;

      const timeBeforeSceneDetection = Date.now();
      console.time(`${fileId}-fileScanning`);
      const vid = new opencv.VideoCapture(filePath);
      const videoLength =
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1;
      // log.debug(videoLength);

      const minSceneLength = 15;

      const frameMetrics = [];
      let lastFrameMean = new opencv.Vec(null, null, null, null);;
      let lastSceneCut = null;

      // transform
      const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
      const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
      let cropTop = 0;
      let cropBottom = 0;
      let cropLeft = 0;
      let cropRight = 0;
      if (transformObject !== undefined && transformObject !== null) {
        console.log(transformObject)
        cropTop = transformObject.cropTop;
        cropBottom = transformObject.cropBottom;
        cropLeft = transformObject.cropLeft;
        cropRight = transformObject.cropRight;
      }
      const cropWidth = width - cropLeft - cropRight;
      const cropHeight = height - cropTop - cropBottom;

      vid.readAsync(err1 => {
        const read = () => {
          vid.readAsync((err, mat) => {
            const frame = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
            if (iterator % 100 === 0) {
              const progressBarPercentage =
                iterator / vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) * 100;
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progress',
                fileId,
                progressBarPercentage
              ); // first half of progress
              log.debug(
                `opencvWorkerWindow | readAsync: frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC
                )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
              );
            }
            let frameMean = 0;
            if (mat.empty === false) {

              // optional cropping
              let matCropped;
              if (transformObject !== undefined && transformObject !== null) {
                matCropped = mat.getRegion(new opencv.Rect(cropLeft, cropTop, cropWidth, cropHeight));
              }

              frameMean = matCropped === undefined ?
                mat.resizeToMax(240).cvtColor(opencv.COLOR_BGR2HSV).mean() :
                matCropped.resizeToMax(240).cvtColor(opencv.COLOR_BGR2HSV).mean();

              const deltaFrameMean = frameMean.absdiff(lastFrameMean);
              const frameHsvAverage = (deltaFrameMean.w + deltaFrameMean.x + deltaFrameMean.y) / 3.0; // w = H, x = S, y = V = brightness

              // initialise first scene cut
              if (lastSceneCut === null) {
                lastSceneCut = frame;
              }

              if (frameHsvAverage >= threshold) {
                if ((frame - lastSceneCut) >= minSceneLength) {
                  // add scene
                  // sceneQueue is used for preview purpose and is pulled from mainWindow
                  const length = frame - lastSceneCut; // length
                  const colorArray = HSVtoRGB(frameMean.w, frameMean.x, frameMean.y);
                  sceneQueue.add({
                    fileId,
                    sheetId,
                    start: lastSceneCut, // start
                    length,
                    colorArray,
                  });

                  lastSceneCut = frame;
                }
              }
              // log.debug(`${frame}: ${deltaFrameMean.y} = ${frameMean.y} - ${lastFrameMean.y}`);
              lastFrameMean = frameMean;

              log.debug(frameMean);
              log.debug(`h: ${frameMean.w}, s: ${frameMean.x}, v: ${frameMean.y}`);
              const meanValue = frameMean.y;
              const meanColor = JSON.stringify(HSVtoRGB(frameMean.w, frameMean.x, frameMean.y));
              frameMetrics.push({
                fileId,
                frameNumber: frame,
                meanValue,
                meanColor,
              });
            } else {
              log.error(
                `empty frame: iterator:${iterator} frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC
                )}ms) of ${vid.get(
                  VideoCaptureProperties.CAP_PROP_FRAME_COUNT
                )}`
              );
              frameMetrics.push({
                fileId,
                frameNumber: frame,
                meanValue: undefined,
                meanColor: undefined,
              });
            }
            iterator += 1;

            if (!fileScanRunning) {
              const messageToSend = `opencvWorkerWindow | File scanning cancelled at frame ${frame}`;
              log.debug(messageToSend);
              console.timeEnd(`${fileId}-fileScanning`);

              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progressMessage',
                'error',
                messageToSend,
                6000
              );

            } else if (iterator < vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)) {
              read();
            } else {
              const timeAfterSceneDetection = Date.now();
              const messageToSend = `File scanning finished - ${(timeAfterSceneDetection -
                timeBeforeSceneDetection) / 1000}s - speed: ${(timeAfterSceneDetection -
                  timeBeforeSceneDetection) / vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`;
              log.debug(`opencvWorkerWindow | ${messageToSend}`);
              console.timeEnd(`${fileId}-fileScanning`);

              // add last scene
              const length = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - lastSceneCut; // length
              const colorArray = HSVtoRGB(frameMean.w, frameMean.x, frameMean.y);
              sceneQueue.add({
                fileId,
                sheetId,
                start: lastSceneCut, // start
                length,
                colorArray,
              });

              // sceneQueue was only necessary for preview
              // clear sceneQueue so it is not accidentally pulled in from mainWindow
              sceneQueue.clear();

              // insert all frames into sqlite3
              insertFrameScanArray(frameMetrics);

              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'received-get-file-scan',
                fileId,
                filePath,
                useRatio,
                sheetId,
              );

              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progress',
                fileId,
                100
              ); // set to full
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progressMessage',
                'info',
                messageToSend,
                3000
              );
            }
          });
        };

        const startFrame = 0;
        let iterator = 0;
        if (err1) throw err1;

        // before scene detection starts clearScenes
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'clearScenes',
          fileId,
          sheetId,
        );

        setPosition(vid, startFrame, useRatio);
        read(); // start reading frames
      });
    } catch (e) {
      log.error(e);
    }
  }
);

ipcRenderer.on('clear-sceneQueue', (event) => {
  log.info('clear-sceneQueue');
  log.info(sceneQueue.size());
  sceneQueue.clear();
  log.info(sceneQueue.size());
});

ipcRenderer.on('get-some-scenes-from-sceneQueue', (event, amount) => {
  log.info('get-some-scenes-from-sceneQueue');
  log.info(sceneQueue.size());
  const someScenes = sceneQueue.removeLastMany(amount);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'receive-some-scenes-from-sceneQueue',
    someScenes,
  );
  log.info(sceneQueue.size());
});

// read sync test
ipcRenderer.on(
  // 'send-get-thumbs',
  'send-get-thumbs-sync',
  (
    event,
    fileId,
    filePath,
    sheetId,
    thumbIdArray,
    frameIdArray,
    frameNumberArray,
    useRatio
  ) => {
    log.debug('opencvWorkerWindow | on send-get-thumbs-sync');
    // log.debug(frameNumberArray);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    log.debug(`opencvWorkerWindow | useRatio: ${useRatio}`);
    // opencv.utils.setLogLevel('LOG_LEVEL_DEBUG');

    try {
      const vid = new opencv.VideoCapture(filePath);

      for (let i = 0; i < frameNumberArray.length; i += 1) {
        setPosition(vid, frameNumberArray[i], useRatio);
        const frame = vid.read();
        if (frame.empty) {
          log.info('opencvWorkerWindow | frame is empty');
          const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
          ipcRenderer.send(
            'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
            'send-base64-frame',
            frameIdArray[i],
            fileId,
            frameNumber,
            ''
          );
          ipcRenderer.send(
            'message-from-opencvWorkerWindow-to-mainWindow',
            'receive-get-thumbs',
            fileId,
            sheetId,
            thumbIdArray[i],
            frameIdArray[i],
            frameNumber,
            i === (frameNumberArray.length - 1)
          );
        } else {
          // log.debug('frame not empty');
          log.debug(
            `opencvWorkerWindow | readSync: ${i}, ${frameNumberArray[i]}/${vid.get(
              VideoCaptureProperties.CAP_PROP_POS_FRAMES
            ) - 1}(${vid.get(
              VideoCaptureProperties.CAP_PROP_POS_MSEC
            )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
          );
          // opencv.imshow('a window name', frame);
          const outBase64 = opencv.imencode('.jpg', frame).toString('base64'); // maybe change to .png?
          const lastThumb = i === (frameNumberArray.length - 1);
          const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
          ipcRenderer.send(
            'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
            'send-base64-frame',
            frameIdArray[i],
            fileId,
            frameNumber,
            outBase64
          );
          ipcRenderer.send(
            'message-from-opencvWorkerWindow-to-mainWindow',
            'receive-get-thumbs',
            fileId,
            sheetId,
            thumbIdArray[i],
            frameIdArray[i],
            frameNumber,
            lastThumb
          );
          // opencv.waitKey(10);
        }
      }
    } catch (e) {
      log.error(e);
    }
  }
);

// read async
ipcRenderer.on(
  // 'send-get-thumbs-async',
  'send-get-thumbs',
  (
    event,
    fileId,
    filePath,
    sheetId,
    thumbIdArray,
    frameIdArray,
    frameNumberArray,
    useRatio,
    frameSize,
    transformObject
  ) => {
    log.debug('opencvWorkerWindow | on send-get-thumbs');
    // log.debug(frameNumberArray);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    log.debug(`opencvWorkerWindow | useRatio: ${useRatio}`);

    try {
      const vid = new opencv.VideoCapture(filePath);
      const timeBefore = Date.now();

      // transform
      const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
      const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
      let cropTop = 0;
      let cropBottom = 0;
      let cropLeft = 0;
      let cropRight = 0;
      if (transformObject !== undefined && transformObject !== null) {
        console.log(transformObject)
        cropTop = transformObject.cropTop;
        cropBottom = transformObject.cropBottom;
        cropLeft = transformObject.cropLeft;
        cropRight = transformObject.cropRight;
      }
      const cropWidth = width - cropLeft - cropRight;
      const cropHeight = height - cropTop - cropBottom;

      vid.readAsync(err1 => {
        const read = (frameOffset = 0) => {
          // limit frameNumberToCapture between 0 and movie length
          const frameNumberToCapture = limitRange(
            frameNumberArray[iterator] + frameOffset,
            0,
            vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1
          );

          setPosition(vid, frameNumberToCapture, useRatio);

          vid.readAsync((err, mat) => {
            // debugger;
            log.debug(
              `opencvWorkerWindow | readAsync: ${iterator}, frameOffset: ${frameOffset}, ${frameNumberToCapture}/${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_FRAMES
              ) - 1}(${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_MSEC
              )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
            );

            if (mat.empty === false) {

              // opencv.imshow('mat', mat);
              // optional cropping
              let matCropped;
              if (transformObject !== undefined && transformObject !== null) {
                matCropped = mat.getRegion(new opencv.Rect(cropLeft, cropTop, cropWidth, cropHeight));
                // matCropped = mat.copy().copyMakeBorder(transformObject.cropTop, transformObject.cropBottom, transformObject.cropLeft, transformObject.cropRight);
                // opencv.imshow('matCropped', matCropped);
              }

              // optional rescale
              let matRescaled;
              if (frameSize !== 0) { // 0 stands for keep original size
                matRescaled = matCropped === undefined ? mat.resizeToMax(frameSize) :  matCropped.resizeToMax(frameSize);
              }
              // opencv.imshow('matRescaled', matRescaled);
              const outBase64 = opencv.imencode('.jpg', matRescaled || matCropped || mat).toString('base64'); // maybe change to .png?
              const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
              const frameId = frameIdArray[iterator];
              const isLastThumb = iterator === (frameNumberArray.length - 1);

              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
                'send-base64-frame',
                frameId,
                fileId,
                frameNumber,
                outBase64
              );
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'receive-get-thumbs',
                fileId,
                sheetId,
                thumbIdArray[iterator],
                frameId,
                frameNumber,
                isLastThumb
              );

              if (isLastThumb) {
                const duration = Date.now() - timeBefore;
                log.debug('lastThumb');
                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'finished-getting-thumbs',
                  fileId,
                  sheetId,
                );
                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'progressMessage',
                  'info',
                  `Loading of frames took ${duration/1000.0}s`,
                  3000
                );
              }

              iterator += 1;
              if (iterator < frameNumberArray.length) {
                read();
              }
            } else {
              log.info('opencvWorkerWindow | frame is empty');
              // assumption is that the we might find frames forward or backward which work
              if (Math.abs(frameOffset) < searchLimit) {
                // if frameNumberToCapture is close to the end go backward else go forward
                if (
                  frameNumberToCapture <
                  vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) -
                    searchLimit
                ) {
                  log.debug('opencvWorkerWindow | will try to read one frame forward');
                  read(frameOffset + 1);
                } else {
                  log.debug('opencvWorkerWindow | will try to read one frame backward');
                  read(frameOffset - 1);
                }
              } else {
                log.debug(
                  'opencvWorkerWindow | still empty, will stop and send an empty frame back'
                );
                const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
                const frameId = frameIdArray[iterator];
                const isLastThumb = iterator === (frameNumberArray.length - 1);

                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
                  'send-base64-frame',
                  frameId,
                  fileId,
                  frameNumber,
                  ''
                );
                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'receive-get-thumbs',
                  fileId,
                  sheetId,
                  thumbIdArray[iterator],
                  frameId,
                  frameNumber,
                  isLastThumb,
                );
                iterator += 1;
                if (iterator < frameNumberArray.length) {
                  read();
                }
              }
            }
          });
        };

        if (err1) throw err1;
        let iterator = 0;
        setPosition(vid, frameNumberArray[iterator], useRatio);
        read();
      });
    } catch (e) {
      log.error(e);
    }
  }
);

render(
  <div>
    <h1>I am the opencv worker window.</h1>
  </div>,
  document.getElementById('worker_opencv')
);
