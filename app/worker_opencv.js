import React from 'react';
import { render } from 'react-dom';
import log from 'electron-log';
import * as tf from '@tensorflow/tfjs-node';

import { VideoCaptureProperties } from './utils/openCVProperties';
import { limitRange, setPosition, fourccToString } from './utils/utils';
import { detectAllFaces } from './utils/faceDetection';
import {
  getCropRect,
  HSVtoRGB,
  detectCut,
  recaptureThumbs,
  rescaleMat,
  transformMat,
} from './utils/utilsForOpencv';
import { IN_OUT_POINT_SEARCH_LENGTH, IN_OUT_POINT_SEARCH_THRESHOLD } from './utils/constants';
import { insertFrameScanArray, insertFaceScanArray } from './utils/utilsForSqlite';
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

// set up queues
// sceneQueue stores scene data, is used for preview purpose and is pulled from mainWindow
const sceneQueue = new Queue();

// imageQueue stores image data, is used when grabbing images and is pulled from databaseWorkerWindow
const imageQueue = new Queue();

log.debug('I am the opencvWorkerWindow - responsible for capturing the necessary frames from the video using opencv');

window.addEventListener('error', event => {
  log.error(event);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'error',
    `There has been an error while loading the Opencv Worker. Please contact us for support: ${event.message}`,
    false,
  );
  event.preventDefault();
});

window.addEventListener('uncaughtException', event => {
  log.error(event);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'error',
    `There has been an uncaughtException while loading the Opencv Worker. Please contact us for support: ${event.message}`,
    false,
  );
  event.preventDefault();
});

window.addEventListener('unhandledrejection', event => {
  log.error(event);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'error',
    `There has been an unhandledrejection while loading the Opencv Worker. Please contact us for support: ${event.message}`,
    false,
  );
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

setInterval(() => {
  // objectUrlQueue
  // console.log(imageQueue.size())
  const size = imageQueue.size();
  if (size !== 0) {
    log.debug(`the imageQueue size is: ${size}`);
    // start requestIdleCallback for imageQueue
    ipcRenderer.send(
      'message-from-opencvWorkerWindow-to-databaseWorkerWindow',
      'start-setIntervalForImages-for-imageQueue',
    );
  }
}, 1000);

ipcRenderer.on('cancelFileScan', () => {
  log.debug('cancelling fileScan');
  fileScanRunning = false;
});

ipcRenderer.on(
  'recapture-frames',
  (event, files, sheetsByFileId, frameSize, fileId = undefined, onlyReplace = true) => {
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
          if (currentSheetArray === undefined) {
            return false;
          }

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
      3000,
    );
  },
);

ipcRenderer.on(
  'send-get-file-details',
  (event, fileId, filePath, posterFrameId, onlyReplace = false, onlyImport = false) => {
    log.debug('opencvWorkerWindow | on send-get-file-details');
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    try {
      const vid = new opencv.VideoCapture(filePath);
      const frameCount = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT);
      const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
      const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
      const fps = vid.get(VideoCaptureProperties.CAP_PROP_FPS);
      const fourCC = fourccToString(vid.get(VideoCaptureProperties.CAP_PROP_FOURCC));

      log.debug(`opencvWorkerWindow | width: ${width}`);
      log.debug(`opencvWorkerWindow | height: ${height}`);
      log.debug(`opencvWorkerWindow | FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
      log.debug(`opencvWorkerWindow | codec: ${fourccToString(vid.get(VideoCaptureProperties.CAP_PROP_FOURCC))}`);

      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'receive-get-file-details',
        fileId,
        filePath,
        posterFrameId,
        frameCount,
        width,
        height,
        fps,
        fourCC,
        onlyReplace,
        onlyImport,
      );
    } catch (e) {
      ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'failed-to-open-file', fileId);
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'progressMessage',
        'error',
        `Failed to open ${filePath}`,
        10000,
      );
      log.error(e);
    }
  },
);

ipcRenderer.on(
  'send-get-poster-frame',
  (event, fileId, filePath, posterFrameId, onlyReplace = false, onlyImport = false) => {
    log.debug('opencvWorkerWindow | on send-get-poster-frame');
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    try {
      const vid = new opencv.VideoCapture(filePath);

      const frameNumberToCapture = Math.floor(vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2); // capture frame in the middle
      vid.readAsync(err1 => {
        const read = function read() {
          setPosition(vid, frameNumberToCapture, false);
          vid.readAsync((err, mat) => {
            log.debug(
              `opencvWorkerWindow | ${frameNumberToCapture}/${vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) -
                1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(
                VideoCaptureProperties.CAP_PROP_FRAME_COUNT,
              )}`,
            );

            let useRatio = false;
            // frames not match
            if (frameNumberToCapture !== vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1) {
              log.debug(
                'opencvWorkerWindow | ########################### Playhead not at correct position: set useRatio to TRUE ###########################',
              );
              useRatio = true;
            }

            if (mat.empty === false) {
              const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // for poster frame jpg is used
              const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES);
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-databaseWorkerWindow',
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
      log.error(e);
    }
  },
);

ipcRenderer.on('send-get-in-and-outpoint', (event, fileId, filePath, useRatio, detectInOutPoint) => {
  log.debug('opencvWorkerWindow | on send-get-in-and-outpoint');
  // log.debug(fileId);
  log.debug(`opencvWorkerWindow | ${filePath}`);

  try {
    console.time(`${fileId}-inPointDetection`);
    const vid = new opencv.VideoCapture(filePath);
    const videoLength = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1;
    // log.debug(videoLength);

    if (detectInOutPoint) {
      console.time(`${fileId}-inOutPointDetection`);
      const timeBeforeInOutPointDetection = Date.now();

      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'progressMessage',
        'info',
        'Detecting in and outpoint',
      );

      const searchLength = Math.min(IN_OUT_POINT_SEARCH_LENGTH, videoLength / 2);
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
                VideoCaptureProperties.CAP_PROP_POS_MSEC,
              )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`,
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
                  frame: vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                  mean: frameMean,
                });
              } else {
                meanArrayOut.push({
                  frame: vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                  mean: frameMean,
                });
              }

              if (
                (searchInpoint && frameMean >= threshold) ||
                (frame >= searchLength && frame < videoLength - searchLength)
              ) {
                // only run if still searching inpoint and frameMean over threshold or done scanning inpoint
                searchInpoint = false; // done searching inPoint
                log.debug('opencvWorkerWindow | resetting playhead');
                setPosition(vid, videoLength - searchLength, useRatio);
                read();
              } else if (frame < searchLength || (frame >= videoLength - searchLength && frame <= videoLength)) {
                // half the amount of ipc events
                if (iterator % 2) {
                  const progressBarPercentage = (iterator / (searchLength * 2)) * 100;
                  ipcRenderer.send(
                    'message-from-opencvWorkerWindow-to-mainWindow',
                    'progress',
                    fileId,
                    progressBarPercentage,
                  ); // first half of progress
                }
                iterator += 1;
                read();
              }
            } else {
              log.error(
                `opencvWorkerWindow | empty frame: iterator:${iterator} frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC,
                )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`,
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
                            ...{ frameThreshold: current.frame },
                          }
                        : largerObject;
                  } else {
                    largerObject = {
                      ...largerObject,
                      ...{ frameThreshold: prev.frameThreshold },
                    };
                  }
                  return largerObject;
                },
                { frame: 0, mean: 0 },
              );
              const meanArrayOutReduced = meanArrayOut.reduceRight(
                (prev, current) => {
                  let largerObject = prev.mean > current.mean ? prev : current;
                  if (prev.frameThreshold === undefined) {
                    largerObject =
                      current.mean > threshold
                        ? {
                            ...largerObject,
                            ...{ frameThreshold: current.frame },
                          }
                        : largerObject;
                  } else {
                    largerObject = {
                      ...largerObject,
                      ...{ frameThreshold: prev.frameThreshold },
                    };
                  }
                  return largerObject;
                },
                { frame: videoLength, mean: 0 },
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
              ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'progress', fileId, 100); // set to full
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progressMessage',
                'info',
                `In and Outpoint detection finished - ${timeAfterInOutPointDetection -
                  timeBeforeInOutPointDetection}ms`,
                3000,
              );
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'receive-get-in-and-outpoint',
                fileId,
                fadeInPoint,
                fadeOutPoint,
              );
            } else {
              log.error(
                `opencvWorkerWindow | something wrong: frame:${frame} > videoLength:${videoLength} || mat.empty ${mat.empty}`,
              );
              // log.debug(meanArrayIn);
              // log.debug(meanArrayOut);
              log.error(
                `opencvWorkerWindow | something wrong: iterator:${iterator} frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC,
                )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`,
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
        videoLength,
      );
    }
  } catch (e) {
    log.error(e);
  }
});

ipcRenderer.on(
  'send-get-file-scan',
  (event, fileId, filePath, useRatio, threshold = 20.0, sheetId, transformObject, shotDetectionMethod) => {
    log.debug('opencvWorkerWindow | on send-get-file-scan');
    // log.debug(fileId);
    log.debug(`opencvWorkerWindow | ${filePath}`);

    try {
      fileScanRunning = true;

      // start requestIdleCallback for sceneQueue
      ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'start-requestIdleCallback-for-sceneQueue');

      const timeBeforeSceneDetection = Date.now();
      console.time(`${fileId}-fileScanning`);
      const vid = new opencv.VideoCapture(filePath);

      const minSceneLength = 15;

      const frameMetrics = [];
      let previousData = {};
      let lastSceneCut = null;

      const cropRect = getCropRect(vid, transformObject);

      vid.readAsync(err1 => {
        const read = () => {
          vid.readAsync((err, mat) => {
            const frame = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
            if (iterator % 100 === 0) {
              const progressBarPercentage = (iterator / vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)) * 100;
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progress',
                fileId,
                progressBarPercentage,
              ); // first half of progress
              log.debug(
                `opencvWorkerWindow | readAsync: frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC,
                )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`,
              );
            }
            if (mat.empty === false) {
              // optional transform
              const matTransformed = transformMat(mat, transformObject, cropRect);

              const resultingData = detectCut(previousData, matTransformed, threshold, shotDetectionMethod);
              const { isCut, lastColorRGB, differenceValue } = resultingData;

              // initialise first scene cut
              if (lastSceneCut === null) {
                lastSceneCut = frame;
              }

              if (isCut) {
                if (frame - lastSceneCut >= minSceneLength) {
                  // add scene
                  // sceneQueue is used for preview purpose and is pulled from mainWindow
                  const length = frame - lastSceneCut; // length
                  sceneQueue.add({
                    fileId,
                    sheetId,
                    start: lastSceneCut, // start
                    length,
                    colorArray: lastColorRGB,
                  });

                  lastSceneCut = frame;
                }
              }

              previousData = { ...resultingData };

              log.debug(differenceValue);
              const meanColor = JSON.stringify(lastColorRGB);
              frameMetrics.push({
                fileId,
                frameNumber: frame,
                differenceValue,
                meanColor,
              });
            } else {
              log.error(
                `empty frame: iterator:${iterator} frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC,
                )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`,
              );
              frameMetrics.push({
                fileId,
                frameNumber: frame,
                differenceValue: undefined,
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
                6000,
              );
            } else if (iterator < vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)) {
              read();
            } else {
              const timeAfterSceneDetection = Date.now();
              const scanDurationInSeconds = (timeAfterSceneDetection - timeBeforeSceneDetection) / 1000;
              const scanDurationString =
                scanDurationInSeconds > 180
                  ? `${Math.floor(scanDurationInSeconds / 60)} minutes`
                  : `${Math.floor(scanDurationInSeconds)} seconds`;
              const messageToSend = `File scanning took ${scanDurationString} (${Math.floor(
                vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / scanDurationInSeconds,
              )} fps)`;
              log.info(`opencvWorkerWindow | ${filePath} - ${shotDetectionMethod} - ${messageToSend}`);
              console.timeEnd(`${fileId}-fileScanning`);

              // add last scene
              const { lastColorRGB } = previousData;

              const length = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - lastSceneCut; // length
              sceneQueue.add({
                fileId,
                sheetId,
                start: lastSceneCut, // start
                length,
                colorArray: lastColorRGB,
              });

              // sceneQueue was only necessary for preview
              // clear sceneQueue so it is not accidentally pulled in from mainWindow
              sceneQueue.clear();

              // insert all frames into sqlite3
              const timeBeforeInsertFrameScanArray = Date.now();
              insertFrameScanArray(fileId, frameMetrics);
              const timeAfterInsertFrameScanArray = Date.now();
              log.debug(
                `opencvWorkerWindow | insertFrameScanArray duration: ${timeAfterInsertFrameScanArray -
                  timeBeforeInsertFrameScanArray}`,
              );

              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'received-get-file-scan',
                fileId,
                filePath,
                useRatio,
                sheetId,
              );

              ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'progress', fileId, 100); // set to full
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progressMessage',
                'info',
                messageToSend,
                5000,
              );
            }
          });
        };

        const startFrame = 0;
        let iterator = 0;
        if (err1) throw err1;

        // before scene detection starts clearScenes
        ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'clearScenes', fileId, sheetId);

        setPosition(vid, startFrame, useRatio);
        read(); // start reading frames
      });
    } catch (e) {
      log.error(e);
    }
  },
);

// get faces async
ipcRenderer.on(
  // 'send-get-thumbs-async',
  'send-get-faces',
  (
    event,
    fileId,
    filePath,
    sheetId,
    frameNumberArray,
    useRatio,
    defaultCachedFramesSize,
    transformObject,
    defaultFaceConfidenceThreshold,
    defaultFaceSizeThreshold,
    defaultFaceUniquenessThreshold,
    faceSortMethod,
    updateSheet = false,
  ) => {
    log.debug('opencvWorkerWindow | on send-get-faces');
    log.debug(`opencvWorkerWindow | ${filePath}`);

    try {
      fileScanRunning = true;
      const frameNumberArrayLength = frameNumberArray.length;

      const timeBeforeFaceDetection = Date.now();
      console.time(`${fileId}-faceScanning`);

      const vid = new opencv.VideoCapture(filePath);

      const detectionArray = [];
      let detectionPromise;

      const cropRect = getCropRect(vid, transformObject);

      vid.readAsync(err1 => {
        const read = () => {
          // limit frameNumberToCapture between 0 and movie length
          const frameNumberToCapture = limitRange(
            frameNumberArray[iterator],
            0,
            vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1,
          );

          setPosition(vid, frameNumberToCapture, useRatio);

          vid.readAsync((err, mat) => {
            const progressBarPercentage = (iterator / frameNumberArrayLength) * 100;
            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'progress',
              fileId,
              progressBarPercentage,
            );
            log.debug(
              `opencvWorkerWindow | readAsync: ${iterator}, ${frameNumberToCapture}/${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_FRAMES,
              ) - 1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(
                VideoCaptureProperties.CAP_PROP_FRAME_COUNT,
              )}`,
            );

            if (mat.empty === false) {
              // opencv.imshow('mat', mat);

              // optional transform
              const matTransformed = transformMat(mat, transformObject, cropRect);

              // optional rescale
              const matResult = rescaleMat(vid, matTransformed, 720);

              const outJpg = opencv.imencode('.jpg', matResult); // for detection jpg is used
              const input = tf.node.decodeJpeg(outJpg);

              detectionPromise = detectAllFaces(
                input,
                frameNumberToCapture,
                detectionArray,
                defaultFaceConfidenceThreshold,
                defaultFaceSizeThreshold,
                defaultFaceUniquenessThreshold,
              );
              // console.log(detectionPromise);
            } else {
              log.debug('opencvWorkerWindow | frame is empty');
            }
            iterator += 1;

            if (!fileScanRunning) {
              const messageToSend = `opencvWorkerWindow | File scanning cancelled at frame ${frameNumberToCapture}`;
              log.debug(messageToSend);
              console.timeEnd(`${fileId}-fileScanning`);

              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progressMessage',
                'error',
                messageToSend,
                6000,
              );
            } else if (iterator < frameNumberArrayLength) {
              read();
            } else {
              detectionPromise // wait for last detectionPromise
                .then(() => {
                  log.debug('lastThumb');
                  console.log(detectionArray);
                  console.log(detectionArray.length);

                  let totalFaceCount = 0;
                  detectionArray.forEach(frame => {
                    const { faceCount, facesArray } = frame;
                    if (faceCount > 0 && facesArray !== undefined) {
                      totalFaceCount += facesArray.length;
                    }
                  });

                  // insert all frames into sqlite3
                  insertFaceScanArray(fileId, detectionArray);

                  const timeAfterFaceDetection = Date.now();
                  const scanDurationInSeconds = (timeAfterFaceDetection - timeBeforeFaceDetection) / 1000;
                  const scanDurationString =
                    scanDurationInSeconds > 180
                      ? `${Math.floor(scanDurationInSeconds / 60)} minutes`
                      : `${Math.floor(scanDurationInSeconds)} seconds`;
                  const messageToSend = `Face scanning took ${scanDurationString} (${Math.floor(
                    vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / scanDurationInSeconds,
                  )} fps)
                ${totalFaceCount} faces found in ${detectionArray.length} of ${frameNumberArray.length} scanned frames`;
                  log.info(`opencvWorkerWindow | ${filePath} - ${messageToSend}`);
                  console.timeEnd(`${fileId}-fileScanning`);

                  ipcRenderer.send(
                    'message-from-opencvWorkerWindow-to-mainWindow',
                    'finished-getting-faces',
                    fileId,
                    sheetId,
                    detectionArray,
                    faceSortMethod,
                    updateSheet,
                  );
                  ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'progress', fileId, 100); // set to full
                  ipcRenderer.send(
                    'message-from-opencvWorkerWindow-to-mainWindow',
                    'progressMessage',
                    'info',
                    messageToSend,
                    10000,
                  );
                  return undefined;
                })
                .catch(err2 => {
                  log.error(err2);
                });
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
  },
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
    transformObject,
  ) => {
    log.debug('opencvWorkerWindow | on send-get-thumbs');
    // log.debug(frameNumberArray);
    log.debug(`opencvWorkerWindow | ${filePath}`);
    log.debug(`opencvWorkerWindow | useRatio: ${useRatio}`);

    log.debug(`opencvWorkerWindow | imageQueue size: ${imageQueue.size()}`);

    log.debug('send-get-thumbs');
    log.debug(transformObject);

    try {
      const frameNumberArrayLength = frameNumberArray.length;

      const vid = new opencv.VideoCapture(filePath);
      const timeBefore = Date.now();
      const frameNumberAndColorArray = [];

      let frameIsEmpty = false;

      const cropRect = getCropRect(vid, transformObject);

      vid.readAsync(err1 => {
        const read = (frameOffset = 0) => {
          // limit frameNumberToCapture between 0 and movie length
          const frameNumberToCapture = limitRange(
            frameNumberArray[iterator] + frameOffset,
            0,
            vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1,
          );

          setPosition(vid, frameNumberToCapture, useRatio);

          vid.readAsync((err, mat) => {
            // debugger;
            log.debug(
              `opencvWorkerWindow | readAsync: ${iterator}, frameOffset: ${frameOffset}, ${frameNumberToCapture}/${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_FRAMES,
              ) - 1}(${vid.get(VideoCaptureProperties.CAP_PROP_POS_MSEC)}ms) of ${vid.get(
                VideoCaptureProperties.CAP_PROP_FRAME_COUNT,
              )}`,
            );

            if (mat.empty === false) {
              frameIsEmpty = false;
              // opencv.imshow('mat', mat);

              // optional transform
              const matTransformed = transformMat(mat, transformObject, cropRect);

              // optional rescale
              const matResult = rescaleMat(vid, matTransformed, frameSize);

              // opencv.imshow('matRescaled', matRescaled);
              const outBase64 = opencv.imencode('.jpg', matResult).toString('base64'); // for internal usage frame jpg is used
              const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
              const frameId = frameIdArray[iterator];
              // get color
              const frameMean = matResult
                .resizeToMax(240)
                .cvtColor(opencv.COLOR_BGR2HSV)
                .mean();
              const colorArray = HSVtoRGB(frameMean.w, frameMean.x, frameMean.y);

              imageQueue.add({
                frameId,
                fileId,
                frameNumber,
                outBase64,
              });

              frameNumberAndColorArray.push({
                fileId,
                sheetId,
                thumbId: thumbIdArray[iterator],
                frameNumber,
                colorArray,
              });

              iterator += 1;
            } else {
              log.debug('opencvWorkerWindow | frame is empty');
              frameIsEmpty = true;
              // assumption is that the we might find frames forward or backward which work
              if (Math.abs(frameOffset) < searchLimit) {
                // if frameNumberToCapture is close to the end go backward else go forward
                if (frameNumberToCapture < vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - searchLimit) {
                  log.debug('opencvWorkerWindow | will try to read one frame forward');
                  read(frameOffset + 1);
                } else {
                  log.debug('opencvWorkerWindow | will try to read one frame backward');
                  read(frameOffset - 1);
                }
              } else {
                log.debug('opencvWorkerWindow | still empty, will stop and send an empty frame back');
                const frameNumber = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
                const frameId = frameIdArray[iterator];

                imageQueue.add({
                  frameId,
                  fileId,
                  frameNumber,
                  base64: '',
                });

                frameNumberAndColorArray.push({
                  fileId,
                  sheetId,
                  thumbId: thumbIdArray[iterator],
                  frameNumber,
                  colorArray: [0, 0, 0],
                });

                frameIsEmpty = false; // reset frameIsEmpty
                iterator += 1;
              }
            }
            if (!frameIsEmpty) {
              // do not read or jump to last thumb if frameIsEmpty as it has its own read function
              if (iterator < frameNumberArrayLength) {
                read();
              } else {
                log.debug('lastThumb');
                const duration = Date.now() - timeBefore;
                log.debug('lastThumb');

                ipcRenderer.send(
                  'message-from-opencvWorkerWindow-to-mainWindow',
                  'update-frameNumber-and-colorArray',
                  frameNumberAndColorArray,
                );

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
                  `Loading of frames took ${duration / 1000.0}s`,
                  3000,
                );
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
  },
);

ipcRenderer.on('clear-sceneQueue', () => {
  log.debug(`opencvWorkerWindow | on clear-sceneQueue ${sceneQueue.size()}`);
  sceneQueue.clear();
});

ipcRenderer.on('get-some-scenes-from-sceneQueue', (event, amount) => {
  log.debug(`opencvWorkerWindow | on get-some-scenes-from-sceneQueue ${sceneQueue.size()}`);
  const someScenes = sceneQueue.removeLastMany(amount);
  ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'receive-some-scenes-from-sceneQueue', someScenes);
  log.debug(sceneQueue.size());
});

ipcRenderer.on('get-some-images-from-imageQueue', (event, amount) => {
  log.debug(`opencvWorkerWindow | on get-some-images-from-imageQueue ${imageQueue.size()}`);
  const someImages = imageQueue.removeLastMany(amount);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-databaseWorkerWindow',
    'receive-some-images-from-imageQueue',
    someImages,
  );
  log.debug(imageQueue.size());
});

render(
  <div>
    <h1>I am the opencv worker window.</h1>
    <canvas id="myCanvas" />
    {/* <img id="myImg" alt='' src='https://spaexecutive.com/wp-content/uploads/2019/06/Yumi.jpg'/> */}
  </div>,
  document.getElementById('worker_opencv'),
);
